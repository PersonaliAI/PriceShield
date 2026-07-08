"""Reporting controller — handles aggregation and dispatch of periodic summaries."""

import logging
import os
import pytz
from croniter import croniter
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from app.services.supabase_service import SupabaseService
from app.services.notification_service import NotificationService
from app.models.invoice import PriceAlert

router = APIRouter(prefix="/reports", tags=["Internal"])
logger = logging.getLogger(__name__)

INTERNAL_AUTH_KEY = os.environ.get("CRON_SECRET", "super-secret-cron-key")

# Fixed cron expressions per cycle (evaluated in each user's local timezone).
# Cron must fire at least hourly from Cloud Scheduler for timezone windows to work.
CYCLE_CRON = {
    "daily":   "0 8 * * *",    # 08:00 every day
    "weekly":  "0 8 * * 1",    # 08:00 every Monday
    "monthly": "0 8 1 * *",    # 08:00 on the 1st of each month
}
CYCLE_DAYS = {
    "daily": 1,
    "weekly": 7,
    "monthly": 30,
}
CYCLE_LABEL = {
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
}
CYCLE_PREF = {
    "daily": "report_daily",
    "weekly": "report_weekly",
    "monthly": "report_monthly",
}


def _is_due_for_user(user, cron_expr: str) -> bool:
    """Return True if the cron expression is due right now in the user's local timezone.

    Mirrors the personaliai pattern:
      1. Convert UTC now → user's local time (truncated to the minute)
      2. Ask croniter for the next fire after (now_local - 1 second)
      3. If that next fire equals now_local → it's due
    """
    tz_str = getattr(user, "timezone", None) or "UTC"
    try:
        tz = pytz.timezone(tz_str)
    except Exception:
        tz = pytz.utc

    now_utc = datetime.now(timezone.utc)
    now_local = now_utc.astimezone(tz).replace(second=0, microsecond=0)

    try:
        it = croniter(cron_expr, now_local - timedelta(seconds=1))
        next_run = it.get_next(datetime)
        if next_run.tzinfo is None:
            next_run = tz.localize(next_run)
        return (
            next_run.year   == now_local.year  and
            next_run.month  == now_local.month and
            next_run.day    == now_local.day   and
            next_run.hour   == now_local.hour  and
            next_run.minute == now_local.minute
        )
    except Exception:
        logger.exception("croniter failed for user %s tz=%s", getattr(user, "uid", "?"), tz_str)
        return False


@router.get("/cron/{cycle}")
async def trigger_reports(
    cycle: str,
    test_uid: Optional[str] = Query(None),
    x_cron_secret: str = Header(None),
):
    """Trigger reports for a specific cycle (daily, weekly, monthly).

    Must be called hourly by Cloud Scheduler so per-user timezone windows are respected.
    Test runs (test_uid set) bypass the timezone/time check.
    """
    logger.info("Triggering %s report. Test UID: %s, Secret Present: %s",
                cycle, test_uid, bool(x_cron_secret))

    if not test_uid and x_cron_secret != INTERNAL_AUTH_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized internal call")

    if cycle not in CYCLE_CRON:
        raise HTTPException(status_code=400, detail=f"Unknown cycle '{cycle}'")

    supabase = SupabaseService()
    notifier = NotificationService()

    if test_uid:
        user = supabase.get_user(test_uid)
        if not user:
            return {"status": "error", "message": "Test user not found"}
        users = [user]
    else:
        users = supabase.get_all_users()

    cron_expr    = CYCLE_CRON[cycle]
    pref_field   = CYCLE_PREF[cycle]
    timeframe    = CYCLE_LABEL[cycle]
    lookback     = CYCLE_DAYS[cycle]
    now_utc      = datetime.now(timezone.utc)
    start_dt     = now_utc - timedelta(days=lookback)
    cutoff_date  = start_dt.date()
    start_date_str = start_dt.strftime("%Y-%m-%d")

    count = 0
    for user in users:
        # Check user preference
        if not test_uid and not getattr(user, pref_field, False):
            continue

        # Timezone-aware scheduling: only send when cron fires in the user's locale.
        # Same pytz+croniter pattern used in personaliai/kin-backend.
        if not test_uid and not _is_due_for_user(user, cron_expr):
            continue

        if not user.email:
            continue

        invoices = supabase.get_all_invoices(user.uid, limit=100)
        period_invoices = [inv for inv in invoices if inv.invoice_date >= cutoff_date]

        saved_alerts = supabase.get_alerts_since(user.uid, start_date_str)
        adapted_alerts = []
        for sa in saved_alerts:
            adapted_alerts.append(PriceAlert(
                vendor_name=sa.vendor_name,
                invoice_date=(
                    sa.created_at.date()
                    if hasattr(sa.created_at, "date")
                    else now_utc.date()
                ),
                flagged_items=sa.flagged_items,
                total_margin_lost=sa.total_margin_lost,
                has_hikes=sa.has_hikes,
            ))

        success = await notifier.send_periodic_report(
            user_email=user.email,
            user_name=user.display_name or "there",
            timeframe=timeframe,
            alerts=adapted_alerts,
            invoices_audited=len(period_invoices),
        )
        if success:
            count += 1

    logger.info("Dispatched %d %s reports", count, cycle)
    return {"status": "success", "dispatched": count}
