"""API Key lifecycle service — generate, validate, revoke, rotate.

Backed by the `api_keys` Postgres table in Supabase.
"""

from __future__ import annotations

import logging
import secrets
import hashlib
from datetime import datetime
from typing import Optional

from app.models.api_models import API_TIER_LIMITS, APIKey, APIKeyListItem, APIKeyResponse, APIKeyTier
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)

KEY_PREFIX = "ps_live_"
KEY_BYTE_LENGTH = 32


class APIKeyService:
    """Manages the full lifecycle of developer API keys."""

    def __init__(self, supabase: Optional[SupabaseService] = None) -> None:
        self.sb = supabase or SupabaseService()

    @property
    def _table(self):
        return self.sb.client.table("api_keys")

    def generate_key(self, user_id: str, name: str, tier: APIKeyTier) -> APIKeyResponse:
        """Create a new API key. Returns the raw key ONCE — it is never stored."""
        raw_key = KEY_PREFIX + secrets.token_hex(KEY_BYTE_LENGTH)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:12]
        
        tier_value = tier.value if hasattr(tier, "value") else str(tier)
        monthly_reset_date = datetime.utcnow().strftime('%Y-%m-01')

        inserted = self._table.insert({
            "id": secrets.token_hex(12), # custom unique identifier
            "user_id": user_id,
            "key_hash": key_hash,
            "key_prefix": key_prefix,
            "name": name,
            "tier": tier_value,
            "is_active": True,
            "monthly_reset_date": monthly_reset_date
        }).execute()

        if not inserted.data:
            raise RuntimeError("Failed to generate API Key in database.")

        row = inserted.data[0]
        logger.info("Generated API key %s (tier=%s) for user %s", row.get("id"), tier_value, user_id)
        
        # Convert created_at timezone
        created_at_str = row.get("created_at", datetime.utcnow().isoformat())
        created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))

        return APIKeyResponse(
            id=row.get("id"),
            raw_key=raw_key,
            name=row.get("name"),
            tier=row.get("tier"),
            created_at=created_at
        )

    def validate_key(self, raw_key: str) -> Optional[APIKey]:
        """Validate a raw API key. Returns APIKey or None."""
        if not raw_key.startswith(KEY_PREFIX):
            return None

        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        try:
            res = self._table.select("*").eq("key_hash", key_hash).eq("is_active", True).limit(1).execute()
            if not res.data:
                return None
            row = res.data[0]

            # Reset monthly requests if month changed
            current_month = datetime.utcnow().strftime('%Y-%m-01')
            if row.get("monthly_reset_date") != current_month:
                self._table.update({
                    "monthly_requests": 0,
                    "monthly_reset_date": current_month
                }).eq("id", row["id"]).execute()
                row["monthly_requests"] = 0
                row["monthly_reset_date"] = current_month

            return APIKey(**row)
        except Exception as e:
            logger.error("API key validation error: %s", e)
            return None

    def check_quota(self, api_key: APIKey, endpoint: str) -> tuple[bool, str]:
        tier_enum = api_key.tier
        if isinstance(tier_enum, str):
            tier_enum = APIKeyTier(tier_enum)

        limits = API_TIER_LIMITS.get(tier_enum, API_TIER_LIMITS[APIKeyTier.FREE])
        
        if endpoint == "extract":
            cap = limits["monthly_extractions"]
            if api_key.monthly_requests >= cap:
                return False, f"Monthly quota exceeded ({api_key.monthly_requests}/{cap}). Upgrade your plan."
        elif endpoint == "compare":
            cap = limits["monthly_comparisons"]
            if api_key.monthly_requests >= cap:
                return False, f"Monthly quota exceeded ({api_key.monthly_requests}/{cap}). Upgrade your plan."

        return True, "ok"

    def increment_usage(self, key_id: str) -> None:
        """Atomically increment request counters. Uses a Postgres function for atomicity."""
        try:
            self.sb.client.rpc("increment_api_key_usage", {"p_key_id": key_id}).execute()
        except Exception:
            # Fallback update
            try:
                res = self._table.select("total_requests, monthly_requests").eq("id", key_id).maybe_single().execute()
                if res and res.data:
                    tot = (res.data.get("total_requests") or 0) + 1
                    mon = (res.data.get("monthly_requests") or 0) + 1
                    self._table.update({
                        "total_requests": tot,
                        "monthly_requests": mon,
                        "last_used_at": datetime.utcnow().isoformat()
                    }).eq("id", key_id).execute()
            except Exception:
                pass

    def revoke_key(self, key_id: str, user_id: str) -> bool:
        res = self._table.select("id, user_id").eq("id", key_id).eq("user_id", user_id).maybe_single().execute()
        if not res or not res.data:
            return False

        self._table.update({"is_active": False}).eq("id", key_id).execute()
        logger.info("Revoked API key %s for user %s", key_id, user_id)
        return True

    def rotate_key(self, key_id: str, user_id: str) -> Optional[APIKeyResponse]:
        res = self._table.select("*").eq("id", key_id).eq("user_id", user_id).maybe_single().execute()
        if not res or not res.data:
            return None
        row = res.data

        # Revoke the current key
        self.revoke_key(key_id, user_id)

        # Generate a new key with same name and tier
        tier_enum = APIKeyTier(row.get("tier"))
        return self.generate_key(user_id, row.get("name", "Default"), tier_enum)

    def list_keys(self, user_id: str) -> list[APIKeyListItem]:
        try:
            res = self._table.select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            items = []
            for r in res.data:
                # Convert created_at and last_used_at to datetimes
                created_at_str = r.get("created_at")
                created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00")) if created_at_str else datetime.utcnow()
                
                last_used_at_str = r.get("last_used_at")
                last_used_at = datetime.fromisoformat(last_used_at_str.replace("Z", "+00:00")) if last_used_at_str else None

                items.append(APIKeyListItem(
                    id=r.get("id"),
                    name=r.get("name", "Default"),
                    key_prefix=r.get("key_prefix", "ps_live_..."),
                    tier=r.get("tier", "api_free"),
                    is_active=r.get("is_active", False),
                    created_at=created_at,
                    last_used_at=last_used_at,
                    total_requests=r.get("total_requests", 0),
                    monthly_requests=r.get("monthly_requests", 0)
                ))
            return items
        except Exception as e:
            logger.error("Failed to list API keys for %s: %s", user_id, e)
            return []

    def get_key(self, key_id: str, user_id: str) -> Optional[APIKey]:
        res = self._table.select("*").eq("id", key_id).eq("user_id", user_id).maybe_single().execute()
        if not res or not res.data:
            return None
        return APIKey(**res.data)
