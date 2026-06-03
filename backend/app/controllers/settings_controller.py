"""Settings controller — API endpoints for user notification preferences."""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.middleware.auth import get_current_user_uid
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["Settings"])


class SettingsResponse(BaseModel):
    """User notification settings."""
    email: str = ""
    priceshield_inbox_email: str = ""
    forwarding_emails: list[str] = []
    telegram_chat_id: Optional[str] = None
    telegram_linked: bool = False
    whatsapp_number: Optional[str] = None
    onesignal_player_id: Optional[str] = None
    alert_channels: list[str] = ["push"]
    alert_email: Optional[str] = None
    report_daily: bool = False
    report_weekly: bool = True
    report_monthly: bool = True
    tier: str = "free"
    manual_uploads_count: int = 0
    alert_threshold: float = 2.0
    slack_webhook_url: Optional[str] = None
    slack_linked: bool = False
    slack_team_id: Optional[str] = None
    locations: list[dict[str, Any]] = []
    country: Optional[str] = None
    timezone: Optional[str] = None
    onboarding_complete: bool = False



class SettingsUpdate(BaseModel):
    """Fields that can be updated by the user."""
    forwarding_emails: Optional[list[str]] = None
    whatsapp_number: Optional[str] = None
    onesignal_player_id: Optional[str] = None
    alert_channels: Optional[list[str]] = None
    alert_email: Optional[str] = None
    report_daily: Optional[bool] = None
    report_weekly: Optional[bool] = None
    report_monthly: Optional[bool] = None
    alert_threshold: Optional[float] = None
    slack_webhook_url: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    onboarding_complete: Optional[bool] = None


@router.get("", summary="Get user notification settings")
async def get_user_settings(user_id: str = Depends(get_current_user_uid)):
    """Return the user's notification preferences and linked accounts."""
    try:
        supabase = SupabaseService()
        user = supabase.get_or_create_user(user_id, "") # Supabase handles login, email is fetched from DB
        cfg = get_settings()
        
        unique_email = f"{user_id}@{cfg.sendgrid_domain}"
        
        response = SettingsResponse(
            email=user.email or "",
            priceshield_inbox_email=unique_email,
            forwarding_emails=getattr(user, "forwarding_emails", []),
            telegram_chat_id=user.telegram_chat_id,
            telegram_linked=bool(user.telegram_chat_id),
            whatsapp_number=user.whatsapp_number,
            onesignal_player_id=getattr(user, "onesignal_player_id", None),
            alert_channels=user.alert_channels or ["push"],
            alert_email=getattr(user, "alert_email", None),
            report_daily=user.report_daily,
            report_weekly=user.report_weekly,
            report_monthly=user.report_monthly,
            tier=user.tier.value if hasattr(user.tier, "value") else getattr(user, "tier", "free"),
            manual_uploads_count=getattr(user, "manual_uploads_count", 0),
            alert_threshold=getattr(user, "alert_threshold", 2.0),
            slack_webhook_url=getattr(user, "slack_webhook_url", None),
            slack_linked=bool(getattr(user, "slack_user_id", None)),
            slack_team_id=getattr(user, "slack_team_id", None),
            locations=[loc.model_dump() for loc in getattr(user, "locations", [])],
            country=user.country,
            timezone=user.timezone,
            onboarding_complete=user.onboarding_complete
        )

        logger.info(f"API Return: inbox={response.priceshield_inbox_email}, forwarding={response.forwarding_emails}")
        return response
    except Exception as exc:
        logger.error("Get settings failed: %s", exc, exc_info=True)
        cfg = get_settings()
        unique_email = f"{user_id}@{cfg.sendgrid_domain}"
        return SettingsResponse(priceshield_inbox_email=unique_email)


@router.put("", summary="Update user notification settings")
async def update_settings(
    update: SettingsUpdate,
    user_id: str = Depends(get_current_user_uid),
):
    """Update the user's notification preferences."""
    try:
        supabase = SupabaseService()

        update_data = {}
        if update.forwarding_emails is not None:
            update_data["forwarding_emails"] = update.forwarding_emails
        if update.whatsapp_number is not None:
            update_data["whatsapp_number"] = update.whatsapp_number
        if update.onesignal_player_id is not None:
            update_data["onesignal_player_id"] = update.onesignal_player_id
        if update.alert_channels is not None:
            update_data["alert_channels"] = update.alert_channels
        if update.alert_email is not None:
            update_data["alert_email"] = update.alert_email
        if update.report_daily is not None:
            update_data["report_daily"] = update.report_daily
        if update.report_weekly is not None:
            update_data["report_weekly"] = update.report_weekly
        if update.report_monthly is not None:
            update_data["report_monthly"] = update.report_monthly
        if update.alert_threshold is not None:
            update_data["alert_threshold"] = update.alert_threshold
        if update.slack_webhook_url is not None:
            update_data["slack_webhook_url"] = update.slack_webhook_url
        if update.country is not None:
            update_data["country"] = update.country
        if update.timezone is not None:
            update_data["timezone"] = update.timezone
        if update.onboarding_complete is not None:
            update_data["onboarding_complete"] = update.onboarding_complete

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        supabase.update_user(user_id, update_data)
        logger.info("Settings updated for user %s: %s", user_id, list(update_data.keys()))

        return {"status": "updated", "fields": list(update_data.keys())}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Update settings failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update settings")
