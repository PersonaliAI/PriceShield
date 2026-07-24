"""Subscription endpoints for LemonSqueezy checkout and webhooks."""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel

from app.config import get_settings
from app.middleware.auth import get_current_user_uid
from app.models.user import SubscriptionTier
from app.services.supabase_service import SupabaseService
from app.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Subscriptions"])


class CheckoutRequest(BaseModel):
    tier: str


class CheckoutResponse(BaseModel):
    url: str


@router.post("/api/subscriptions/checkout", response_model=CheckoutResponse)
async def create_checkout(
    req: CheckoutRequest,
    user_claims: dict[str, str] = Depends(get_current_user_claims)
) -> Any:
    """Generate a secure LemonSqueezy checkout URL for the requested tier."""
    user_id = user_claims["uid"]
    token_email = user_claims.get("email") or ""

    supabase = SupabaseService()
    user = supabase.get_or_create_user(user_id, token_email)
    
    if (not user.email or user.email == "") and token_email:
        user.email = token_email
        supabase.save_user(user)
        user = supabase.get_user(user_id) or user

    if not user.email:
        logger.warning(f"User {user_id} attempted checkout without an email address.")
        raise HTTPException(
            status_code=400, 
            detail="Your profile is missing an email address. Please update it in Settings before upgrading."
        )

    settings = get_settings()
    store_id = settings.lemonsqueezy_store_id
    
    if req.tier == "pro":
        variant_id = settings.lemonsqueezy_variant_pro
    elif req.tier == "multi":
        variant_id = settings.lemonsqueezy_variant_multi
    else:
        raise HTTPException(status_code=400, detail="Invalid tier requested")

    if not store_id or not variant_id:
        logger.warning(f"Missing LemonSqueezy config for {req.tier} checkout. Dev mode.")
        return {"url": f"https://priceshield.lemonsqueezy.com/checkout/dev?variant={variant_id}&user={user_id}"}

    sub_service = SubscriptionService()
    checkout_url = await sub_service.create_checkout(
        store_id=store_id,
        variant_id=variant_id,
        user_id=user_id,
        user_email=user.email
    )

    if not checkout_url:
        if not get_settings().lemonsqueezy_api_key:
            raise HTTPException(
                status_code=501, 
                detail="Billing integration is currently in 'Setup Mode'. Please configure LemonSqueezy API keys in the management console."
            )
        raise HTTPException(status_code=500, detail="Failed to generate checkout URL")

    return {"url": checkout_url}


@router.post("/api/webhooks/lemonsqueezy")
async def lemonsqueezy_webhook(
    request: Request,
    x_signature: str = Header(None)
) -> Any:
    """Listen for LemonSqueezy subscription lifecycle events."""
    raw_body = await request.body()
    sub_service = SubscriptionService()

    if not sub_service.verify_webhook_signature(x_signature or "", raw_body):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_name = payload.get("meta", {}).get("event_name")
    if not event_name:
        return {"status": "ignored"}

    logger.info(f"Received LemonSqueezy webhook: {event_name}")

    data = payload.get("data", {})
    attributes = data.get("attributes", {})
    custom_data = payload.get("meta", {}).get("custom_data", {})
    user_id = custom_data.get("user_id")

    if not user_id:
        user_id = attributes.get("custom_data", {}).get("user_id")

    if not user_id:
        logger.warning("No user_id found in LemonSqueezy webhook payload")
        return {"status": "no_user_id"}

    supabase = SupabaseService()
    user = supabase.get_user(user_id)
    if not user:
        logger.warning(f"User {user_id} from webhook not found in DB")
        return {"status": "user_not_found"}

    settings = get_settings()

    if event_name in ["subscription_created", "subscription_updated"]:
        status = attributes.get("status")
        variant_id = str(attributes.get("variant_id"))
        subscription_id = str(data.get("id"))
        customer_id = str(attributes.get("customer_id"))

        if variant_id == settings.lemonsqueezy_variant_multi:
            new_tier = SubscriptionTier.MULTI
        elif variant_id == settings.lemonsqueezy_variant_pro:
            new_tier = SubscriptionTier.PRO
        else:
            new_tier = SubscriptionTier.FREE

        if status in ["cancelled", "expired", "unpaid", "paused", "past_due"]:
            new_tier = SubscriptionTier.FREE

        supabase.update_user(user_id, {
            "tier": new_tier.value,
            "ls_customer_id": customer_id,
            "ls_subscription_id": subscription_id,
            "ls_subscription_status": status
        })
        logger.info(f"User {user_id} subscription updated to tier {new_tier.value}")

    elif event_name in ["subscription_cancelled", "subscription_expired"]:
        status = attributes.get("status")
        supabase.update_user(user_id, {
            "tier": SubscriptionTier.FREE.value,
            "ls_subscription_status": status
        })
        logger.info(f"User {user_id} subscription cancelled/expired. Reverted to FREE.")

    return {"status": "success"}
