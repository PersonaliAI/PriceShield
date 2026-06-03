"""Dashboard controller — API endpoints for the Next.js analytics frontend."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import get_current_user_uid
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _get_supabase():
    """Safely try to get SupabaseService; returns None if unavailable."""
    try:
        return SupabaseService()
    except Exception as exc:
        logger.warning("Supabase unavailable: %s", exc)
        return None


@router.get("/summary", summary="Get KPI summary for dashboard")
async def get_summary(user_id: str = Depends(get_current_user_uid)):
    """Return total margin lost, hikes caught, and top offending vendor."""
    supabase = _get_supabase()
    if supabase is None:
        return {"total_margin_lost": 0, "hikes_caught": 0, "top_offending_vendor": "N/A", "vendors_tracked": 0}
    try:
        _ = supabase.get_or_create_user(user_id, "")
        summary = supabase.get_dashboard_summary(user_id)
        logger.info("Dashboard summary for %s: %s", user_id, summary)
        return summary
    except Exception as exc:
        logger.exception("Dashboard summary error for user %s", user_id)
        return {"total_margin_lost": 0, "hikes_caught": 0, "top_offending_vendor": "N/A", "vendors_tracked": 0}


@router.get("/debug-summary/{uid}", summary="Debug: get summary for a specific UID")
async def debug_summary(uid: str):
    """Temporary debug endpoint — no auth required."""
    supabase = _get_supabase()
    if supabase is None:
        return {"error": "supabase unavailable"}
    try:
        alerts = supabase.get_alerts(uid, limit=500)
        summary = supabase.get_dashboard_summary(uid)
        return {"alert_count": len(alerts), "summary": summary}
    except Exception as exc:
        logger.exception("Debug summary error")
        return {"error": str(exc)}


@router.get("/price-trends", summary="Get price trends for a SKU")
async def get_price_trends(
    vendor_name: str = Query(...),
    item_name: str = Query(...),
    user_id: str = Depends(get_current_user_uid),
):
    """Return chronological unit_price data for a specific item at a vendor — for Recharts."""
    supabase = _get_supabase()
    if supabase is None:
        return {"vendor": vendor_name, "item": item_name, "data": []}
    try:
        invoices = supabase.get_invoices_for_vendor(user_id, vendor_name, limit=100)

        # Extract the price history for the requested item
        trend_data = []
        for inv in reversed(invoices):  # chronological order
            for item in inv.items:
                if item.item_name.lower() == item_name.lower():
                    trend_data.append({
                        "date": inv.invoice_date.isoformat(),
                        "unit_price": item.unit_price,
                        "quantity": item.quantity,
                    })
                    break

        return {"vendor": vendor_name, "item": item_name, "data": trend_data}
    except Exception as exc:
        logger.error("Price trends error: %s", exc)
        return {"vendor": vendor_name, "item": item_name, "data": []}


@router.get("/invoices", summary="Get invoice table data with variances")
async def get_invoices(
    vendor_name: Optional[str] = Query(None, description="Filter by vendor"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_uid),
):
    """Return a filterable table of invoices with week-over-week variance data."""
    supabase = _get_supabase()
    if supabase is None:
        return {"rows": [], "total": 0}
    try:
        if vendor_name:
            invoices = supabase.get_invoices_for_vendor(user_id, vendor_name, limit=50)
        else:
            invoices = supabase.get_all_invoices(user_id, limit=50)

        # Build table rows with variance calculations
        table_rows = []
        price_history: dict[str, list[float]] = {}

        # Process in chronological order for variance calc
        for inv in reversed(invoices):
            for item in inv.items:
                key = f"{inv.vendor_name}:{item.item_name}"

                previous_prices = price_history.get(key, [])
                variance_pct = 0.0
                if previous_prices:
                    old = previous_prices[-1]
                    if old > 0:
                        variance_pct = round(((item.unit_price - old) / old) * 100, 2)

                table_rows.append({
                    "invoice_date": inv.invoice_date.isoformat(),
                    "vendor_name": inv.vendor_name,
                    "item_name": item.item_name,
                    "sku": item.sku,
                    "unit_price": item.unit_price,
                    "quantity": item.quantity,
                    "total_price": item.total_price,
                    "variance_pct": variance_pct,
                })

                price_history.setdefault(key, []).append(item.unit_price)

        # Sort newest items first
        table_rows.reverse()
        
        # Apply item-level pagination
        paginated_rows = table_rows[offset : offset + limit]
        return {"rows": paginated_rows, "total": len(table_rows)}
    except Exception as exc:
        logger.error("Invoices error: %s", exc)
        return {"rows": [], "total": 0}


@router.get("/vendors", summary="Get list of vendors for the user")
async def get_vendors(user_id: str = Depends(get_current_user_uid)):
    """Return a unique list of vendor names from the user's invoices."""
    supabase = _get_supabase()
    if supabase is None:
        return {"vendors": []}
    try:
        invoices = supabase.get_all_invoices(user_id, limit=500) # Fetch up to 500 invoices
        vendors = sorted(set(inv.vendor_name for inv in invoices))
        return {"vendors": vendors}
    except Exception as exc:
        logger.error("Vendors error: %s", exc)
        return {"vendors": []}
