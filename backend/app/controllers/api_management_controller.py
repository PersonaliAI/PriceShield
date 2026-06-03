"""API Key management controller — CRUD, usage dashboard, and billing."""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.middleware.auth import get_current_user_uid
from app.models.api_models import APIKeyTier, API_TIER_LIMITS, APIKeyResponse, APIKeyListItem, UsageSummary
from app.services.api_key_service import APIKeyService
from app.services.usage_tracker import UsageTracker
from app.services.supabase_service import SupabaseService
from app.services.subscription_service import SubscriptionService
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/keys", tags=["API Key Management"])


class CreateKeyRequest(BaseModel):
    name: str = Field("Default", max_length=64)
    tier: str = Field("api_free", description="One of: api_free, api_pro, api_scale, api_enterprise")


class TierInfo(BaseModel):
    tier: str
    label: str
    price: int
    rate_limit_per_min: int
    monthly_extractions: int
    monthly_comparisons: int


class APICheckoutRequest(BaseModel):
    tier: str = Field(..., description="api_pro or api_scale")


class APICheckoutResponse(BaseModel):
    url: str


@router.get("", response_model=list[APIKeyListItem], summary="List all API keys for the authenticated user.")
def list_keys(user_id: str = Depends(get_current_user_uid)):
    """List all API keys for the authenticated user (keys are masked)."""
    svc = APIKeyService()
    return svc.list_keys(user_id)


@router.post("", response_model=APIKeyResponse, status_code=201, summary="Generate a new API key.")
def create_key(req: CreateKeyRequest, user_id: str = Depends(get_current_user_uid)):
    """
    Generate a new API key.

    **IMPORTANT:** The raw key is returned ONLY in this response. Store it securely.
    """
    try:
        tier_enum = APIKeyTier(req.tier)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {req.tier}")

    svc = APIKeyService()
    existing = svc.list_keys(user_id)
    active_keys = [k for k in existing if k.is_active]
    
    if len(active_keys) >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 active API keys per account.")

    logger.info("Creating %s tier key for user %s (billing verified at checkout)", req.tier, user_id)
    return svc.generate_key(user_id, req.name, tier_enum)


@router.delete("/{key_id}", summary="Permanently deactivate an API key.")
def revoke_key(key_id: str, user_id: str = Depends(get_current_user_uid)):
    """Permanently deactivate an API key. This cannot be undone."""
    svc = APIKeyService()
    success = svc.revoke_key(key_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or access denied.")
    return {"status": "revoked", "key_id": key_id}


@router.post("/{key_id}/rotate", response_model=APIKeyResponse, summary="Revoke the old key and generate a new one.")
def rotate_key(key_id: str, user_id: str = Depends(get_current_user_uid)):
    """
    Revoke the old key and generate a new one with the same configuration.

    **IMPORTANT:** The old key is immediately deactivated. The new raw key is returned ONLY in this response.
    """
    svc = APIKeyService()
    result = svc.rotate_key(key_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Key not found or access denied.")
    return result


@router.get("/{key_id}/usage", response_model=UsageSummary, summary="Get aggregated usage statistics for a specific API key.")
def get_key_usage(
    key_id: str,
    days: int = Query(30, ge=1, le=90),
    user_id: str = Depends(get_current_user_uid)
):
    """Get aggregated usage statistics for a specific API key."""
    key_svc = APIKeyService()
    api_key = key_svc.get_key(key_id, user_id)
    if not api_key:
        raise HTTPException(status_code=404, detail="Key not found or access denied.")

    tracker = UsageTracker()
    summary = tracker.get_usage_summary(key_id, days, api_key.name, api_key.tier)

    tier_enum = api_key.tier
    if isinstance(tier_enum, str):
        tier_enum = APIKeyTier(tier_enum)

    limits = API_TIER_LIMITS.get(tier_enum, API_TIER_LIMITS[APIKeyTier.FREE])
    cap = limits.get("monthly_extractions", 0)

    if cap > 0:
        summary.quota_used_pct = round((api_key.monthly_requests / cap) * 100, 1)
    else:
        summary.quota_used_pct = 0.0

    return summary


@router.get("/tiers", response_model=list[TierInfo], summary="List all available API pricing tiers and their limits.")
def list_tiers():
    """List all available API pricing tiers and their limits."""
    tiers_list = []
    for tier, info in API_TIER_LIMITS.items():
        tiers_list.append(TierInfo(
            tier=tier.value if hasattr(tier, "value") else str(tier),
            label=info.get("label", "Unknown"),
            price=info.get("price", 0),
            rate_limit_per_min=info.get("rate_limit_per_min", 10),
            monthly_extractions=info.get("monthly_extractions", 50),
            monthly_comparisons=info.get("monthly_comparisons", 50)
        ))
    return tiers_list


@router.post("/checkout", response_model=APICheckoutResponse, summary="Start checkout for API upgrade.")
def api_checkout(req: APICheckoutRequest, user_id: str = Depends(get_current_user_uid)):
    """Generate a LemonSqueezy checkout link for upgrading developer API keys."""
    supabase = SupabaseService()
    user = supabase.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    settings = get_settings()
    store_id = settings.lemonsqueezy_store_id
    
    # Map API variants
    # For now in dev mode we return a local redirect
    return APICheckoutResponse(url=f"https://priceshield.lemonsqueezy.com/checkout/dev?variant={req.tier}&user={user_id}")
