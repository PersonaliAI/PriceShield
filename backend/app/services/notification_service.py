"""Notification service — dispatches alerts via Telegram, WhatsApp, and OneSignal (email + push)."""

from __future__ import annotations

import logging
import base64
import os
from typing import Optional, List, Union

import httpx

from app.config import get_settings
from app.models.invoice import PriceAlert

logger = logging.getLogger(__name__)


class NotificationService:
    """Sends formatted alerts via Telegram, WhatsApp, and OneSignal (email + push).

    OneSignal replaces SendGrid — handles both transactional email (10K/month free)
    and browser/mobile push notifications through a single API.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    # ------------------------------------------------------------------ #
    #  Message formatting
    # ------------------------------------------------------------------ #
    @staticmethod
    def format_hike_alert(alert: PriceAlert) -> str:
        """Format the price-hike alert: headline impact, top increases, proof hint."""
        n = len(alert.flagged_items)
        lines = [
            f"🚨 <b>Price Hike Detected — {alert.vendor_name}</b>",
            f"Invoice {alert.invoice_date} · {n} item{'s' if n != 1 else ''} flagged",
            "",
            f"Estimated margin impact: <b>${alert.total_margin_lost:.2f}</b>",
            "",
        ]
        top = sorted(alert.flagged_items, key=lambda f: f.margin_lost, reverse=True)[:3]
        for f in top:
            lines.append(
                f"• <b>{f.item_name}</b>: ${f.old_price:.2f} → ${f.new_price:.2f} "
                f"(+{f.variance_pct}%, −${f.margin_lost:.2f})"
            )
        if n > len(top):
            lines.append(f"…and {n - len(top)} more item{'s' if n - len(top) != 1 else ''}.")
        lines.append("")
        lines.append("Reply 'PROOF' to see the full list of flagged items.")
        return "\n".join(lines)

    @staticmethod
    def format_all_clear(vendor_name: str) -> str:
        """Format the all-clear message."""
        return (
            f"✅ <b>PriceShield Check:</b> {vendor_name} invoice processed. "
            f"Zero price hikes detected. Your margins are safe."
        )

    @staticmethod
    def format_historical_audit(alerts: list[PriceAlert]) -> str:
        """Format the onboarding historical audit summary."""
        total_loss = sum(a.total_margin_lost for a in alerts)
        total_items = sum(len(a.flagged_items) for a in alerts)
        lines = [
            "📊 <b>PriceShield Historical Audit Complete!</b>\n",
            f"We analysed your last {len(alerts) + 1} invoices and found:\n",
            f"💸 Total historical margin leaked: <b>${total_loss:.2f}</b>",
            f"🔴 <b>{total_items}</b> stealth price hikes detected\n",
        ]
        for alert in alerts:
            if alert.has_hikes:
                lines.append(
                    f"  • {alert.vendor_name} ({alert.invoice_date}): "
                    f"${alert.total_margin_lost:.2f} lost across {len(alert.flagged_items)} items"
                )
        lines.append("\nYour baseline is now set. We'll watch every future invoice. 🛡️")
        return "\n".join(lines)

    @staticmethod
    def format_proof(alert: PriceAlert) -> str:
        """Format the detailed list when user replies 'PROOF'."""
        lines = [f"📋 <b>Flagged Items — {alert.vendor_name} ({alert.invoice_date}):</b>\n"]
        for i, f in enumerate(alert.flagged_items, 1):
            lines.append(
                f"{i}. <b>{f.item_name}:</b> ${f.old_price:.2f} → ${f.new_price:.2f} "
                f"(<b>+{f.variance_pct}%</b>) — Lost ${f.margin_lost:.2f}"
            )
        lines.append(f"\n💰 <b>Total margin lost:</b> ${alert.total_margin_lost:.2f}")
        return "\n".join(lines)

    @staticmethod
    def _build_hike_email_html(alert: PriceAlert) -> str:
        """Build a rich HTML email for price hike alerts."""
        rows_html = ""
        for f in alert.flagged_items:
            rows_html += (
                f"<tr>"
                f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a3e;'>{f.item_name}</td>"
                f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a3e;text-align:right;'>${f.old_price:.2f}</td>"
                f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a3e;text-align:right;color:#f87171;'>${f.new_price:.2f}</td>"
                f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a3e;text-align:right;color:#f87171;'>+{f.variance_pct}%</td>"
                f"<td style='padding:8px 12px;border-bottom:1px solid #2a2a3e;text-align:right;'>${f.margin_lost:.2f}</td>"
                f"</tr>"
            )

        return f"""
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#dc2626,#f97316);padding:24px 32px;">
                <h1 style="margin:0;font-size:20px;color:#fff;">🚨 Price Hike Detected</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{alert.vendor_name} — {alert.invoice_date}</p>
            </div>
            <div style="padding:24px 32px;">
                <div style="display:flex;gap:16px;margin-bottom:24px;">
                    <div style="flex:1;background:#1a1a2e;border-radius:8px;padding:16px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Margin Lost</p>
                        <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#f87171;">${alert.total_margin_lost:.2f}</p>
                    </div>
                    <div style="flex:1;background:#1a1a2e;border-radius:8px;padding:16px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Items Flagged</p>
                        <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#fbbf24;">{len(alert.flagged_items)}</p>
                    </div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="background:#1a1a2e;">
                            <th style="padding:10px 12px;text-align:left;color:#94a3b8;font-weight:600;">Item</th>
                            <th style="padding:10px 12px;text-align:right;color:#94a3b8;font-weight:600;">Old</th>
                            <th style="padding:10px 12px;text-align:right;color:#94a3b8;font-weight:600;">New</th>
                            <th style="padding:10px 12px;text-align:right;color:#94a3b8;font-weight:600;">Change</th>
                            <th style="padding:10px 12px;text-align:right;color:#94a3b8;font-weight:600;">Loss</th>
                        </tr>
                    </thead>
                    <tbody>{rows_html}</tbody>
                </table>
                <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
                    🛡️ Powered by PriceShield — protecting your margins automatically
                </p>
            </div>
        </div>
        """

    @staticmethod
    def _build_all_clear_email_html(vendor_name: str) -> str:
        """Build HTML email for all-clear notifications."""
        return f"""
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#059669,#10b981);padding:24px 32px;">
                <h1 style="margin:0;font-size:20px;color:#fff;">✅ All Clear</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{vendor_name} invoice processed</p>
            </div>
            <div style="padding:24px 32px;text-align:center;">
                <p style="font-size:48px;margin:16px 0;">🛡️</p>
                <p style="font-size:16px;font-weight:600;">Zero price hikes detected</p>
                <p style="font-size:14px;color:#94a3b8;margin-top:8px;">Your margins are safe. We'll keep watching.</p>
            </div>
        </div>
        """

    @staticmethod
    def _build_report_email_html(
        user_name: str,
        timeframe: str,
        total_loss: float,
        alerts: list[PriceAlert],
        invoices_audited: int = 0,
    ) -> str:
        """Build HTML email for periodic reports (Daily/Weekly/Monthly)."""
        rows_html = ""
        for alert in alerts:
            if not alert.has_hikes: continue
            rows_html += (
                f"<tr>"
                f"<td style='padding:12px;border-bottom:1px solid #2a2a3e;'><b>{alert.vendor_name}</b><br/><span style='font-size:11px;color:#94a3b8;'>{alert.invoice_date}</span></td>"
                f"<td style='padding:12px;border-bottom:1px solid #2a2a3e;text-align:right;color:#f87171;'>${alert.total_margin_lost:.2f}</td>"
                f"<td style='padding:12px;border-bottom:1px solid #2a2a3e;text-align:right;'>{len(alert.flagged_items)} items</td>"
                f"</tr>"
            )

        hikes_count = sum(len(a.flagged_items) for a in alerts if a.has_hikes)
        vendors_count = len({a.vendor_name for a in alerts if a.has_hikes})

        # Top 5 individual increases across all alerts, by margin impact
        all_flags = [f for a in alerts if a.has_hikes for f in a.flagged_items]
        top_rows_html = ""
        for f in sorted(all_flags, key=lambda x: x.margin_lost, reverse=True)[:5]:
            top_rows_html += (
                f"<tr>"
                f"<td style='padding:10px 12px;border-bottom:1px solid #2a2a3e;'>{f.item_name}</td>"
                f"<td style='padding:10px 12px;border-bottom:1px solid #2a2a3e;text-align:right;'>${f.old_price:.2f}</td>"
                f"<td style='padding:10px 12px;border-bottom:1px solid #2a2a3e;text-align:right;color:#f87171;'>${f.new_price:.2f}</td>"
                f"<td style='padding:10px 12px;border-bottom:1px solid #2a2a3e;text-align:right;color:#f87171;'>+{f.variance_pct}%</td>"
                f"<td style='padding:10px 12px;border-bottom:1px solid #2a2a3e;text-align:right;'>${f.margin_lost:.2f}</td>"
                f"</tr>"
            )
        top_section = ""
        if top_rows_html:
            top_section = f"""
                <h3 style="font-size:16px;margin:32px 0 16px;color:#fff;">Top Price Increases</h3>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="background:#1a1a2e;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
                            <th style="padding:10px 12px;text-align:left;">Item</th>
                            <th style="padding:10px 12px;text-align:right;">Was</th>
                            <th style="padding:10px 12px;text-align:right;">Now</th>
                            <th style="padding:10px 12px;text-align:right;">Change</th>
                            <th style="padding:10px 12px;text-align:right;">Impact</th>
                        </tr>
                    </thead>
                    <tbody>{top_rows_html}</tbody>
                </table>
            """

        kpi_row = f"""
                <div style="display:flex;gap:12px;margin-bottom:24px;">
                    <div style="flex:1;background:#1a1a2e;border-radius:8px;padding:16px;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Invoices Audited</p>
                        <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#e2e8f0;">{invoices_audited}</p>
                    </div>
                    <div style="flex:1;background:#1a1a2e;border-radius:8px;padding:16px;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Hikes Detected</p>
                        <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#fbbf24;">{hikes_count}</p>
                    </div>
                    <div style="flex:1;background:#1a1a2e;border-radius:8px;padding:16px;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Vendors Affected</p>
                        <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#e2e8f0;">{vendors_count}</p>
                    </div>
                </div>
        """

        return f"""
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;">
                <h1 style="margin:0;font-size:24px;color:#fff;">📈 {timeframe} Price Report</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Hi {user_name}, here is your automated margin audit summary.</p>
            </div>
            <div style="padding:32px;">
                <div style="background:#1a1a2e;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;border:1px solid #312e81;">
                    <p style="margin:0;font-size:14px;color:#94a3b8;">Total Margin Leaked ({timeframe})</p>
                    <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:#f87171;">${total_loss:.2f}</p>
                </div>
                {kpi_row}
                <h3 style="font-size:16px;margin-bottom:16px;color:#fff;">Invoice Summary</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead>
                        <tr style="background:#1a1a2e;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
                            <th style="padding:12px;text-align:left;">Supplier</th>
                            <th style="padding:12px;text-align:right;">Loss</th>
                            <th style="padding:12px;text-align:right;">Hikes</th>
                        </tr>
                    </thead>
                    <tbody>{rows_html if rows_html else "<tr><td colspan='3' style='padding:32px;text-align:center;color:#94a3b8;'>Zero price hikes detected in this period. 🎉</td></tr>"}</tbody>
                </table>
                {top_section}
                <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2a2a3e;text-align:center;">
                    <a href="https://trypriceshield.com/dashboard" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Full Dashboard</a>
                </div>
            </div>
        </div>
        """

    @staticmethod
    def _build_auth_email_html(user_name: str, link: str, type: str) -> str:
        """Build a premium branded HTML email for Auth links (Reset/Verify)."""
        title = "🔒 Reset Your Password" if type == "reset" else "👋 Verify Your Email"
        action_text = "Reset Password" if type == "reset" else "Verify Email"
        description = (
            "Someone (hopefully you) requested a password reset for your PriceShield account. "
            "If you didn't do this, just ignore this email."
            if type == "reset"
            else "Welcome to PriceShield! Please verify your email to secure your account and start protecting your margins."
        )

        return f"""
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
            <div style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 32px;text-align:center;">
                <img src="https://trypriceshield.com/logo.png" alt="PriceShield" style="height:48px;margin-bottom:24px;"/>
                <h1 style="margin:0;font-size:24px;color:#fff;font-weight:700;">{title}</h1>
            </div>
            <div style="padding:40px 32px;text-align:center;">
                <p style="font-size:16px;line-height:1.6;color:#94a3b8;margin-bottom:32px;">
                    Hi {user_name or 'there'},<br/><br/>
                    {description}
                </p>
                
                <a href="{link}" style="display:inline-block;background:#10b981;color:#fff;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(16,185,129,0.25);">
                    {action_text}
                </a>

                <p style="margin-top:40px;font-size:12px;color:#4b5563;">
                    If the button doesn't work, copy and paste this link into your browser:<br/>
                    <span style="word-break:break-all;color:#6366f1;">{link}</span>
                </p>
                
                <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1a1a2e;">
                    <p style="font-size:12px;color:#4b5563;">
                        🛡️ PriceShield — The AI-Powered Margin Guardian<br/>
                        Helping you catch every stealth price hike.
                    </p>
                </div>
            </div>
        </div>
        """

    @staticmethod
    def html_to_mrkdwn(text: str) -> str:
        """Convert basic HTML (<b>) to Slack-compatible mrkdwn."""
        import re
        text = re.sub(r"<b>(.*?)</b>", r"*\1*", text)
        return text

    @staticmethod
    def md_to_html(text: str) -> str:
        """Convert basic Markdown (**bold**, *italic*) to Telegram-compatible HTML."""
        import re
        text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
        text = re.sub(r"\*(.*?)\*", r"<i>\1</i>", text)
        return text

    # ------------------------------------------------------------------ #
    #  Telegram
    # ------------------------------------------------------------------ #
    async def send_telegram(self, chat_id: str, message: str, parse_mode: str = "HTML") -> bool:
        """Send a message via Telegram Bot API."""
        if not self.settings.telegram_bot_token:
            logger.debug("Telegram not configured — skipping")
            return False

        if parse_mode == "HTML":
            message = self.md_to_html(message)

        url = f"https://api.telegram.org/bot{self.settings.telegram_bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id, 
            "text": message,
            "parse_mode": parse_mode
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, timeout=10)
                resp.raise_for_status()
                logger.info("Telegram message sent to %s", chat_id)
                return True
            except httpx.HTTPError as exc:
                logger.error("Telegram send failed: %s", exc)
                return False

    # ------------------------------------------------------------------ #
    #  WhatsApp Cloud API
    # ------------------------------------------------------------------ #
    async def send_whatsapp(self, phone_number: str, message: str) -> bool:
        """Send a text message via WhatsApp Cloud API."""
        if not self.settings.whatsapp_token or not self.settings.whatsapp_phone_number_id:
            logger.debug("WhatsApp not configured — skipping")
            return False

        url = (
            f"https://graph.facebook.com/v18.0/"
            f"{self.settings.whatsapp_phone_number_id}/messages"
        )
        headers = {"Authorization": f"Bearer {self.settings.whatsapp_token}"}
        clean_phone = "".join(filter(str.isdigit, phone_number))

        payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "text",
            "text": {"body": message},
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=headers, timeout=10)
                resp.raise_for_status()
                logger.info("WhatsApp message sent to %s", phone_number)
                return True
            except httpx.HTTPError as exc:
                logger.error("WhatsApp send failed: %s", exc)
                return False

    # ------------------------------------------------------------------ #
    #  Slack Webhooks
    # ------------------------------------------------------------------ #
    async def send_slack(self, webhook_url: str, message: str) -> bool:
        """Send a message via Slack Incoming Webhook."""
        if not webhook_url:
            logger.debug("Slack webhook URL missing — skipping")
            return False

        message = self.html_to_mrkdwn(message)
        
        if "Reply 'PROOF'" in message:
            message = message.replace(
                "Reply 'PROOF' to see the full list of flagged items.",
                f"<https://trypriceshield.com/dashboard/settings|View full details on your Dashboard> 🛡️"
            )

        payload = {"text": message}

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(webhook_url, json=payload, timeout=10)
                resp.raise_for_status()
                logger.info("Slack message sent successfully")
                return True
            except httpx.HTTPError as exc:
                logger.error("Slack send failed: %s", exc)
                return False

    async def send_slack_bot(self, channel_id: str, message: str) -> bool:
        """Send a message via Slack Bot API (requires SLACK_BOT_TOKEN)."""
        if not self.settings.slack_bot_token:
            logger.debug("Slack bot token missing — skipping")
            return False

        message = self.html_to_mrkdwn(message)
        
        if "Reply 'PROOF'" in message:
            message = message.replace(
                "Reply 'PROOF' to see the full list of flagged items.",
                f"<https://trypriceshield.com/dashboard/settings|View full details on your Dashboard> 🛡️"
            )

        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {self.settings.slack_bot_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel_id,
            "text": message
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=headers, timeout=10)
                resp_data = resp.json()
                if not resp_data.get("ok"):
                    logger.error("Slack bot send failed: %s", resp_data.get("error"))
                    return False
                logger.info("Slack bot message sent to %s", channel_id)
                return True
            except Exception as exc:
                logger.error("Slack bot send failed: %s", exc)
                return False

    # ------------------------------------------------------------------ #
    #  OneSignal — Email (replaces SendGrid)
    # ------------------------------------------------------------------ #
    async def send_onesignal_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        attachments: Optional[List[str]] = None
    ) -> bool:
        """Send a transactional email via OneSignal Email API.
        
        attachments: List of file paths to attach (will be base64 encoded).
        OneSignal free tier: 10,000 emails/month.
        """
        if not self.settings.onesignal_app_id or not self.settings.onesignal_api_key:
            logger.debug("OneSignal not configured — skipping email")
            return False

        url = "https://api.onesignal.com/api/v1/notifications"
        headers = {
            "Authorization": f"Basic {self.settings.onesignal_api_key}",
            "Content-Type": "application/json",
        }
        
        encoded_attachments = []
        if attachments:
            for path in attachments:
                if os.path.exists(path):
                    with open(path, "rb") as f:
                        content = base64.b64encode(f.read()).decode("utf-8")
                        encoded_attachments.append({
                            "name": os.path.basename(path),
                            "content": content
                        })

        payload = {
            "app_id": self.settings.onesignal_app_id,
            "include_email_tokens": [to_email],
            "email_subject": subject,
            "email_body": html_body,
            "include_unsubscribed": True,
            "channel_for_external_user_ids": "email",
        }
        
        if encoded_attachments:
            payload["email_attachments"] = encoded_attachments

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=headers, timeout=15)
                resp.raise_for_status()
                logger.info("OneSignal email sent to %s: %s", to_email, subject)
                return True
            except httpx.HTTPError as exc:
                logger.error("OneSignal email failed: %s — %s", exc, getattr(exc, 'response', None))
                return False

    # ------------------------------------------------------------------ #
    #  OneSignal — Push Notification
    # ------------------------------------------------------------------ #
    async def send_onesignal_push(
        self,
        player_id: Optional[str] = None,
        external_user_id: Optional[str] = None,
        title: str = "PriceShield Alert",
        message: str = "",
        data: Optional[dict] = None,
    ) -> bool:
        """Send a push notification via OneSignal REST API."""
        if not self.settings.onesignal_app_id or not self.settings.onesignal_api_key:
            logger.debug("OneSignal not configured — skipping push")
            return False

        url = "https://api.onesignal.com/api/v1/notifications"
        headers = {
            "Authorization": f"Basic {self.settings.onesignal_api_key}",
            "Content-Type": "application/json",
        }
        payload: dict = {
            "app_id": self.settings.onesignal_app_id,
            "headings": {"en": title},
            "contents": {"en": message},
        }

        if player_id:
            payload["include_player_ids"] = [player_id]
        elif external_user_id:
            payload["include_external_user_ids"] = [external_user_id]
        else:
            logger.warning("OneSignal push: no target specified")
            return False

        if data:
            payload["data"] = data

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, json=payload, headers=headers, timeout=10)
                resp.raise_for_status()
                logger.info("OneSignal push sent: %s", message[:50])
                return True
            except httpx.HTTPError as exc:
                logger.error("OneSignal push failed: %s", exc)
                return False

    # ------------------------------------------------------------------ #
    #  Dispatch helper
    # ------------------------------------------------------------------ #
    async def dispatch_alert(
        self,
        alert: Union[PriceAlert, 'Alert'],
        telegram_chat_id: Optional[str] = None,
        whatsapp_number: Optional[str] = None,
        onesignal_player_id: Optional[str] = None,
        user_uid: Optional[str] = None,
        user_email: Optional[str] = None,
        alert_email: Optional[str] = None,
        slack_webhook_url: Optional[str] = None,
        slack_channel_id: Optional[str] = None,
        alert_channels: list[str] = None,
    ) -> None:
        """Send the appropriate alert to ALL configured channels:
        - Telegram (chat message)
        - WhatsApp (text message)
        - OneSignal Email (rich HTML transactional email)
        - OneSignal Push (browser/mobile notification)
        - Slack (webhook)
        """
        channels = alert_channels if alert_channels is not None else ["push"]
        target_email = alert_email or user_email

        from app.models.alert import AlertType
        
        if getattr(alert, "alert_type", None) == AlertType.HISTORICAL_AUDIT:
            text_message = alert.message
            email_subject = f"📊 PriceShield Audit: ${alert.total_margin_lost:.2f} Margin Impact"
            msg_html = alert.message.replace('\n', '<br/>')
            email_html = f"<div style='font-family:sans-serif;padding:20px;background:#0f0f1a;color:#fff;'>{msg_html}</div>"
            push_title = "📊 Historical Audit Complete"
        elif alert.has_hikes:
            n_items = len(alert.flagged_items)
            text_message = self.format_hike_alert(alert)
            email_subject = (
                f"Price hike: {alert.vendor_name} — ${alert.total_margin_lost:.2f} margin impact "
                f"({n_items} item{'s' if n_items != 1 else ''})"
            )
            email_html = self._build_hike_email_html(alert)
            push_title = f"🚨 Price Hike: {alert.vendor_name}"
        else:
            text_message = self.format_all_clear(alert.vendor_name)
            email_subject = f"{alert.vendor_name}: invoice audited — no price changes"
            email_html = self._build_all_clear_email_html(alert.vendor_name)
            push_title = f"✅ {alert.vendor_name} — All Clear"

        results = []

        if telegram_chat_id:
            results.append(("telegram", await self.send_telegram(telegram_chat_id, text_message)))

        if whatsapp_number:
            results.append(("whatsapp", await self.send_whatsapp(whatsapp_number, text_message)))

        if target_email and "email" in channels:
            results.append((
                "email",
                await self.send_onesignal_email(target_email, email_subject, email_html),
            ))

        if (onesignal_player_id or user_uid) and "push" in channels:
            results.append((
                "push",
                await self.send_onesignal_push(
                    player_id=onesignal_player_id,
                    external_user_id=user_uid,
                    title=push_title,
                    message=text_message[:200],
                    data={
                        "type": "price_alert",
                        "vendor": alert.vendor_name,
                        "has_hikes": alert.has_hikes,
                    },
                ),
            ))

        if "slack" in channels:
            if slack_webhook_url:
                results.append(("slack_webhook", await self.send_slack(slack_webhook_url, text_message)))
            elif slack_channel_id:
                results.append(("slack_bot", await self.send_slack_bot(slack_channel_id, text_message)))

        sent = [ch for ch, ok in results if ok]
        failed = [ch for ch, ok in results if not ok]
        if sent:
            logger.info("Alert dispatched via: %s", ", ".join(sent))
        if failed:
            logger.warning("Alert failed on: %s", ", ".join(failed))

    async def send_periodic_report(
        self,
        user_email: str,
        user_name: str,
        timeframe: str,
        alerts: list[PriceAlert],
        invoices_audited: int = 0,
    ) -> bool:
        """Collect alerts and send a periodic summary report with PDF download link."""
        if not user_email:
            return False
            
        total_loss = sum(a.total_margin_lost for a in alerts if a.has_hikes)
        subject = f"PriceShield {timeframe} Report: ${total_loss:.2f} Margin Impact"
        
        # Generate PDF
        from app.services.pdf_service import PDFService
        pdf_service = PDFService()
        pdf_path = pdf_service.generate_weekly_report(user_name, timeframe, total_loss, alerts)
        
        # Upload PDF to Supabase Storage and get a signed URL
        pdf_url = None
        try:
            from app.services.supabase_service import SupabaseService
            supabase = SupabaseService()
            
            import os
            blob_name = f"reports/{user_email.split('@')[0]}/{os.path.basename(pdf_path)}"
            
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            
            destination = supabase.upload_file(pdf_bytes, blob_name, content_type="application/pdf")
            pdf_url = supabase.get_signed_url(destination, expiration_minutes=10080)
            logger.info("PDF uploaded to Storage: %s", destination)
        except Exception as e:
            logger.error("Failed to upload PDF to Storage: %s", e)
        finally:
            try:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
            except Exception:
                pass
        
        html = self._build_report_email_html(user_name, timeframe, total_loss, alerts, invoices_audited)
        
        if pdf_url:
            pdf_button = f"""
            <div style="margin-top:24px;text-align:center;">
                <a href="{pdf_url}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">📄 Download Full PDF Report</a>
                <p style="font-size:11px;color:#94a3b8;margin-top:8px;">Link expires in 7 days</p>
            </div>
            """
            html = html.replace("View Full Dashboard</a>", "View Full Dashboard</a>" + pdf_button)
        
        success = await self.send_onesignal_email(user_email, subject, html)
        return success

    async def send_auth_email(
        self,
        to_email: str,
        link: str,
        type: str,
        user_name: Optional[str] = None
    ) -> bool:
        """Send a branded identity management email (Reset/Verify) via OneSignal."""
        subject = "🛡️ Reset Your PriceShield Password" if type == "reset" else "🛡️ Verify Your PriceShield Account"
        html = self._build_auth_email_html(user_name, link, type)
        return await self.send_onesignal_email(to_email, subject, html)
