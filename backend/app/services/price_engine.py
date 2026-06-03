from __future__ import annotations
import logging
import difflib
from typing import Any, Optional
from collections import defaultdict

from app.models.invoice import ExtractionResult, Invoice, LineItem, PriceAlert, PriceFlag
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)

DEFAULT_THRESHOLD_PCT = 2.0

class PriceEngine:
    """Core business logic for price comparison and historical auditing."""
    def __init__(self, firebase: SupabaseService, gemini: Optional[Any] = None, threshold_pct: float = DEFAULT_THRESHOLD_PCT):
        self.firebase = firebase
        self.gemini = gemini
        self.threshold = threshold_pct

    def _match_baseline_item(self, item: LineItem, baseline: dict[str, Any]) -> Optional[str]:
        """Try to match a current item to a baseline key using SKU, Exact Name, or Fuzzy Match."""
        # 1. Match by SKU
        if item.sku:
            for b_key, b_val in baseline.items():
                if b_val.get("sku") == item.sku:
                    return b_key

        # 2. Exact name match
        if item.item_name in baseline:
            return item.item_name

        # 3. Fuzzy name match
        close_matches = difflib.get_close_matches(item.item_name, baseline.keys(), n=1, cutoff=0.85)
        if close_matches:
            return close_matches[0]

        return None

    def _calculate_variance_flag(self, current_item: LineItem, baseline_val: dict[str, Any]) -> Optional[PriceFlag]:
        """Compare a current item against a baseline entry and return a PriceFlag if threshold exceeded."""
        old_price = float(baseline_val.get("unit_price") or 0.0)
        old_uom = baseline_val.get("unit_of_measure")
        new_price = current_item.unit_price
        new_uom = current_item.unit_of_measure
        qty = current_item.quantity

        if old_price <= 0:
            return None

        # Correct quantity if it looks like derived units (e.g. qty=1 but total suggests more)
        if qty <= 1.05 and current_item.total_price and current_item.total_price > new_price * 1.05:
            derived_qty = current_item.total_price / new_price
            logger.warning("Correcting quantity for '%s': %.2f -> %.2f (based on total_price)", current_item.item_name, qty, derived_qty)
            qty = derived_qty

        price_variance = ((new_price - old_price) / old_price) * 100
        margin_lost = (new_price - old_price) * qty

        if price_variance >= self.threshold:
            return PriceFlag(
                item_name=current_item.item_name,
                sku=current_item.sku or baseline_val.get("sku"),
                old_price=round(old_price, 2),
                new_price=round(new_price, 2),
                old_uom=old_uom,
                new_uom=new_uom,
                variance_pct=round(price_variance, 2),
                quantity=round(qty, 2),
                margin_lost=round(margin_lost, 2)
            )

        return None

    async def compare_prices(self, extraction: ExtractionResult, user_id: str) -> PriceAlert:
        """Compare extracted invoice items against the stored baseline (Auto-Forward path)."""
        # Load baseline
        baseline = self.firebase.get_baseline(user_id, extraction.vendor_name)
        
        if not baseline:
            # Fall back to latest invoice as baseline
            logger.info("No baseline doc found for '%s', using latest invoice as fallback.", extraction.vendor_name)
            latest_inv = self.firebase.get_latest_invoice_for_vendor(user_id, extraction.vendor_name)
            if latest_inv:
                logger.info("Using previous invoice from %s as baseline for %s comparison.", latest_inv.invoice_date, extraction.vendor_name)
                baseline = {
                    item.item_name: {
                        "sku": item.sku,
                        "unit_price": item.unit_price,
                        "unit_of_measure": item.unit_of_measure,
                        "last_invoice_date": latest_inv.invoice_date.isoformat()
                    }
                    for item in latest_inv.items
                }
            else:
                baseline = {}

        flagged = []
        total_loss = 0.0
        biggest_jump_pct = 0.0
        biggest_jump_item = None

        for item in extraction.items:
            matched_key = self._match_baseline_item(item, baseline)
            if matched_key:
                flag = self._calculate_variance_flag(item, baseline[matched_key])
                if flag:
                    flagged.append(flag)
                    total_loss += flag.margin_lost
                    if flag.variance_pct > biggest_jump_pct:
                        biggest_jump_pct = flag.variance_pct
                        biggest_jump_item = flag.item_name
            else:
                logger.debug("New item '%s' — no baseline to compare.", item.item_name)

        return PriceAlert(
            vendor_name=extraction.vendor_name,
            invoice_date=extraction.invoice_date,
            flagged_items=flagged,
            total_margin_lost=round(total_loss, 2),
            biggest_jump_item=biggest_jump_item,
            biggest_jump_pct=round(biggest_jump_pct, 2) if biggest_jump_pct > 0 else None,
            has_hikes=len(flagged) > 0,
            is_duplicate=False
        )

    async def run_historical_audit(self, extractions: list[ExtractionResult], user_id: str) -> list[PriceAlert]:
        """
        Cold-start audit (Manual path): group by vendor, sort chronologically,
        and perform a ROLLING baseline comparison (item vs its last known price).
        """
        vendor_groups = defaultdict(list)
        for ext in extractions:
            vendor_groups[ext.vendor_name].append(ext)

        all_alerts = []

        for vendor_name, group in vendor_groups.items():
            sorted_v_extractions = sorted(group, key=lambda e: e.invoice_date)
            rolling_baseline = {}

            # First, check if there's any existing database baseline we should preload
            db_baseline = self.firebase.get_baseline(user_id, vendor_name)
            if db_baseline:
                rolling_baseline.update(db_baseline)

            for ext in sorted_v_extractions:
                flagged = []
                total_loss = 0.0
                biggest_jump_pct = 0.0
                biggest_jump_item = None

                for item in ext.items:
                    matched_key = self._match_baseline_item(item, rolling_baseline)
                    if matched_key:
                        flag = self._calculate_variance_flag(item, rolling_baseline[matched_key])
                        if flag:
                            flagged.append(flag)
                            total_loss += flag.margin_lost
                            if flag.variance_pct > biggest_jump_pct:
                                biggest_jump_pct = flag.variance_pct
                                biggest_jump_item = flag.item_name
                    
                # Update rolling baseline for subsequent invoices in the audit
                for item in ext.items:
                    rolling_baseline[item.item_name] = {
                        "sku": item.sku,
                        "unit_price": item.unit_price,
                        "unit_of_measure": item.unit_of_measure,
                        "last_invoice_date": ext.invoice_date.isoformat()
                    }

                alert = PriceAlert(
                    vendor_name=ext.vendor_name,
                    invoice_date=ext.invoice_date,
                    flagged_items=flagged,
                    total_margin_lost=round(total_loss, 2),
                    biggest_jump_item=biggest_jump_item,
                    biggest_jump_pct=round(biggest_jump_pct, 2) if biggest_jump_pct > 0 else None,
                    has_hikes=len(flagged) > 0,
                    is_duplicate=False
                )
                all_alerts.append(alert)

                # Persist updated baseline state to the DB for this vendor
                self.firebase.save_baseline(user_id, vendor_name, ext.items, ext.invoice_date)

        return all_alerts
