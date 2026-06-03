"""Slack API service — handles interactions with Slack bot API."""

from __future__ import annotations

import hmac
import hashlib
import logging
import time
from typing import Optional, Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class SlackService:
    """Encapsulates all logic for interacting with the Slack Web API."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.bot_token = self.settings.slack_bot_token
        self.signing_secret = self.settings.slack_signing_secret

    def verify_signature(self, timestamp: str, body: bytes, signature: str) -> bool:
        """Verify the signature of an inbound webhook from Slack."""
        if not self.signing_secret:
            logger.warning("Slack signing secret not configured. Skipping verification.")
            return True

        # Check for replay attacks
        if abs(time.time() - int(timestamp)) > 60 * 5:
            return False

        sig_basestring = f"v0:{timestamp}:{body.decode('utf-8')}".encode("utf-8")
        computed_sig = "v0=" + hmac.new(
            self.signing_secret.encode("utf-8"),
            sig_basestring,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_sig, signature)

    def _format_mrkdwn(self, text: str) -> str:
        """Converts standard Markdown to Slack's mrkdwn flavor."""
        import re
        text = re.sub(r'\*\*(.*?)\*\*', r'*\1*', text)
        return text

    async def post_message(self, channel: str, text: str, blocks: Optional[list[dict]] = None) -> bool:
        """Send a message to a Slack channel or DM."""
        if not self.bot_token:
            logger.error("Slack bot token missing — cannot send message")
            return False

        formatted_text = self._format_mrkdwn(text)

        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {self.bot_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel,
            "text": formatted_text
        }
        if blocks:
            payload["blocks"] = blocks

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=headers, timeout=10)
                resp_data = resp.json()
                if not resp_data.get("ok"):
                    logger.error("Slack postMessage error: %s", resp_data.get("error"))
                    return False
                return True
            except Exception as exc:
                logger.error("Slack postMessage failed: %s", exc)
                return False

    async def download_file(self, url_private: str) -> bytes:
        """Download a file from Slack using the Bot token."""
        if not self.bot_token:
            raise ValueError("Slack bot token missing — cannot download file")

        headers = {"Authorization": f"Bearer {self.bot_token}"}
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(url_private, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp.content

    async def get_user_email(self, user_id: str) -> Optional[str]:
        """Fetch a user's email from Slack to assist with account linking."""
        if not self.bot_token:
            return None

        url = "https://slack.com/api/users.info"
        params = {"user": user_id}
        headers = {"Authorization": f"Bearer {self.bot_token}"}

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, params=params, headers=headers)
                data = resp.json()
                if data.get("ok"):
                    return data["user"]["profile"].get("email")
                return None
            except Exception as exc:
                logger.error("Slack users.info failed: %s", exc)
                return None

    async def exchange_oauth_code(self, code: str) -> Optional[dict[str, Any]]:
        """Exchange an OAuth code for access information."""
        if not self.settings.slack_client_id or not self.settings.slack_client_secret:
            logger.error("Slack OAuth credentials missing")
            return None

        url = "https://slack.com/api/oauth.v2.access"
        payload = {
            "client_id": self.settings.slack_client_id,
            "client_secret": self.settings.slack_client_secret,
            "code": code,
            "redirect_uri": self.settings.slack_redirect_uri
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, data=payload)
                data = resp.json()
                if data.get("ok"):
                    return data
                logger.error("Slack OAuth exchange failed: %s", data.get("error"))
                return None
            except Exception as exc:
                logger.error("Slack OAuth exchange failed: %s", exc)
                return None
