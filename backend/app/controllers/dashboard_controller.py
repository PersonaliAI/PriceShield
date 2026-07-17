"""Dashboard controller — API endpoints for the Next.js analytics frontend."""

from __future__ import annotations

import io
import logging
from datetime import date as date_cls
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from openpyxl import Workbook
from openpyxl.styles import Font

from app.middleware.auth import get_current_user_uid
from app.models.invoice import Invoice
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


def _fetch_history_invoices(
    supabase: SupabaseService,
    user_id: str,
    vendor_name: Optional[str],
    start_date: Optional[date_cls],
    end_date: Optional[date_cls],
    search: Optional[str],
) -> list[Invoice]:
    """Fetch invoices for the extraction-history view, applying filters in-memory."""
    if vendor_name:
        invoices = supabase.get_invoices_for_vendor(user_id, vendor_name, limit=1000)
    else:
        invoices = supabase.get_all_invoices(user_id, limit=1000)

    if start_date:
        invoices = [inv for inv in invoices if inv.invoice_date >= start_date]
    if end_date:
        invoices = [inv for inv in invoices if inv.invoice_date <= end_date]
    if search:
        needle = search.strip().lower()
        invoices = [
            inv for inv in invoices
            if needle in (inv.invoice_number or "").lower()
            or needle in inv.vendor_name.lower()
            or any(needle in item.item_name.lower() for item in inv.items)
        ]

    return invoices


@router.get("/history", summary="Get invoice extraction history")
async def get_history(
    vendor_name: Optional[str] = Query(None, description="Filter by vendor"),
    start_date: Optional[date_cls] = Query(None, description="Filter invoices on/after this date"),
    end_date: Optional[date_cls] = Query(None, description="Filter invoices on/before this date"),
    search: Optional[str] = Query(None, description="Search invoice #, vendor, or item name"),
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_uid),
):
    """Return a paginated, filterable list of extracted invoices (one row per invoice)."""
    supabase = _get_supabase()
    if supabase is None:
        return {"rows": [], "total": 0}
    try:
        invoices = _fetch_history_invoices(supabase, user_id, vendor_name, start_date, end_date, search)
        total = len(invoices)
        paginated = invoices[offset : offset + limit]

        rows = [
            {
                "id": inv.id,
                "invoice_date": inv.invoice_date.isoformat(),
                "vendor_name": inv.vendor_name,
                "invoice_number": inv.invoice_number,
                "item_count": len(inv.items),
                "subtotal": inv.subtotal,
                "tax_total": inv.tax_total,
                "grand_total": inv.grand_total,
                "currency": inv.currency,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
            }
            for inv in paginated
        ]
        return {"rows": rows, "total": total}
    except Exception as exc:
        logger.error("History error: %s", exc)
        return {"rows": [], "total": 0}


@router.get("/history/export", summary="Export invoice extraction history to Excel")
async def export_history(
    vendor_name: Optional[str] = Query(None),
    start_date: Optional[date_cls] = Query(None),
    end_date: Optional[date_cls] = Query(None),
    search: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_uid),
):
    """Build an .xlsx workbook of extracted invoices (summary + line items) and stream it back."""
    supabase = _get_supabase()
    if supabase is None:
        raise HTTPException(status_code=503, detail="Data store unavailable")

    try:
        invoices = _fetch_history_invoices(supabase, user_id, vendor_name, start_date, end_date, search)

        wb = Workbook()
        bold = Font(bold=True)

        summary_ws = wb.active
        summary_ws.title = "Invoices"
        summary_headers = [
            "Invoice Date", "Vendor", "Invoice #", "Item Count",
            "Subtotal", "Tax Total", "Grand Total", "Currency", "Extracted At",
        ]
        summary_ws.append(summary_headers)
        for cell in summary_ws[1]:
            cell.font = bold
        for inv in invoices:
            summary_ws.append([
                inv.invoice_date.isoformat(),
                inv.vendor_name,
                inv.invoice_number,
                len(inv.items),
                inv.subtotal,
                inv.tax_total,
                inv.grand_total,
                inv.currency,
                inv.created_at.isoformat() if inv.created_at else None,
            ])

        items_ws = wb.create_sheet("Line Items")
        item_headers = [
            "Invoice Date", "Vendor", "Invoice #", "Item Name", "SKU",
            "Quantity", "Unit of Measure", "Unit Price", "Total Price",
        ]
        items_ws.append(item_headers)
        for cell in items_ws[1]:
            cell.font = bold
        for inv in invoices:
            for item in inv.items:
                items_ws.append([
                    inv.invoice_date.isoformat(),
                    inv.vendor_name,
                    inv.invoice_number,
                    item.item_name,
                    item.sku,
                    item.quantity,
                    item.unit_of_measure,
                    item.unit_price,
                    item.total_price,
                ])

        for ws in (summary_ws, items_ws):
            for col_cells in ws.columns:
                length = max((len(str(c.value)) for c in col_cells if c.value is not None), default=10)
                ws.column_dimensions[col_cells[0].column_letter].width = min(max(length + 2, 10), 40)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        filename = f"priceshield-invoice-history-{date_cls.today().isoformat()}.xlsx"
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        logger.exception("History export error for user %s", user_id)
        raise HTTPException(status_code=500, detail="Failed to generate export") from exc
