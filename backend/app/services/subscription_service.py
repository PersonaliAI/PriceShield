"""LemonSqueezy API integration service."""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Handles communicating with the LemonSqueezy API."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.api_key = self.settings.lemonsqueezy_api_key
        self.webhook_secret = self.settings.lemonsqueezy_webhook_secret
        self.base_url = "https://api.lemonsqueezy.com/v1"

    async def create_checkout(self, store_id: str, variant_id: str, user_id: str, user_email: str) -> Optional[str]:
        """Generate a LemonSqueezy checkout URL for a specific plan variant."""
        if not self.api_key:
            logger.warning("LemonSqueezy API key not set. Cannot generate checkout URL.")
            return None

        url = f"{self.base_url}/checkouts"
        headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {
                        "email": user_email,
                        "custom": {
                            "user_id": user_id
                        }
                    }
                },
                "relationships": {
                    "store": {
                        "data": {
                            "type": "stores",
                            "id": store_id
                        }
                    },
                    "variant": {
                        "data": {
                            "type": "variants",
                            "id": variant_id
                        }
                    }
                }
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code not in (200, 201):
                    logger.error("LemonSqueezy API Error: %s", response.text)
                    return None

                data = response.json()
                return data.get("data", {}).get("attributes", {}).get("url")
            except Exception as e:
                logger.error("Failed to connect to LemonSqueezy API: %s", e)
                return None

    def verify_webhook_signature(self, signature: str, raw_body: bytes) -> bool:
        """Verify the HMAC signature of a LemonSqueezy webhook."""
        if not self.webhook_secret:
            logger.warning("LemonSqueezy webhook secret not set. Skipping signature verification for dev.")
            return True

        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)
