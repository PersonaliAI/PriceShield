"""Email ingestion service — polls a Gmail inbox via IMAP for forwarded invoices."""

from __future__ import annotations

import asyncio
import base64
import email
import imaplib
import logging
from email.header import decode_header
from typing import Optional

from app.config import get_settings
from app.models.invoice import Invoice
from app.services.gemini_service import GeminiService
from app.services.notification_service import NotificationService
from app.services.price_engine import PriceEngine
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class EmailIngestionService:
    """Connects to a Gmail inbox via IMAP and polls for invoice PDFs."""

    def __init__(self, supabase: Optional[SupabaseService] = None) -> None:
        self.settings = get_settings()
        self.sb = supabase or SupabaseService()
        self._running = False

    @property
    def is_configured(self) -> bool:
        """Check if email ingestion credentials are provided."""
        return bool(self.settings.ingestion_email and self.settings.ingestion_email_password)

    def _connect(self) -> imaplib.IMAP4_SSL:
        """Create an IMAP SSL connection and authenticate."""
        mail = imaplib.IMAP4_SSL(self.settings.ingestion_imap_server)
        mail.login(self.settings.ingestion_email, self.settings.ingestion_email_password)
        return mail

    def _decode_header_value(self, value: str) -> str:
        """Decode an email header value that may be encoded."""
        decoded_parts = decode_header(value)
        result = []
        for part, charset in decoded_parts:
            if isinstance(part, bytes):
                result.append(part.decode(charset or "utf-8", errors="replace"))
            else:
                result.append(part)
        return " ".join(result)

    def _extract_pdfs(self, msg: email.message.Message) -> list[tuple[str, bytes]]:
        """Extract all PDF attachments from an email message.
        Returns list of (filename, pdf_bytes) tuples.
        """
        pdfs: list[tuple[str, bytes]] = []
        for part in msg.walk():
            content_type = part.get_content_type()
            filename = part.get_filename()

            if content_type == "application/pdf" or (
                filename and filename.lower().endswith(".pdf")
            ):
                payload = part.get_payload(decode=True)
                if payload:
                    name = self._decode_header_value(filename) if filename else "invoice.pdf"
                    pdfs.append((name, payload))
                    logger.info("Found PDF attachment: %s (%d bytes)", name, len(payload))

        return pdfs

    def _is_invoice_email(self, subject: str, body: str) -> bool:
        """Quick heuristic check: does this email look like it contains an invoice?"""
        keywords = [
            "invoice", "bill", "statement", "receipt", "purchase order",
            "delivery", "order confirmation", "payment", "quotation", "po #",
            "inv-", "inv #", "amount due", "total due",
        ]
        text = f"{subject} {body}".lower()
        return any(kw in text for kw in keywords)

    def _get_body_text(self, msg: email.message.Message) -> str:
        """Extract plain text body from email."""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        return payload.decode(charset, errors="replace")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
        return ""

    def _find_user_by_forwarding_email(self, sender_email: str) -> Optional[str]:
        """Look up which user has registered this sender as their forwarding email.
        Falls back to matching by sender email directly.
        """
        try:
            return self.sb.find_user_uid_by_forwarding_email(sender_email)
        except Exception as exc:
            logger.error("Supabase user lookup failed: %s", exc)
            return None

    async def _process_email(
        self, 
        sender: str, 
        subject: str, 
        pdfs: list[tuple[str, bytes]] = None,
        text_content: str = None
    ) -> None:
        """Run extraction pipeline for PDFs or raw body text."""
        user_id = self._find_user_by_forwarding_email(sender)
        if not user_id:
            logger.warning("Skipping email from %s — no matching user", sender)
            return

        user = self.sb.get_user(user_id)
        
        from app.models.user import SubscriptionTier
        notifier = NotificationService()
        if not user or getattr(user, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
            logger.warning("Skipping email from %s — user %s is on FREE tier", sender, user_id)
            if user and user.telegram_chat_id:
                await notifier.send_telegram(
                    user.telegram_chat_id,
                    "🔒 *Email Forwarding Blocked*\n\n"
                    "Your invoices were received via email, but auto-forwarding is a Pro Shield feature.\n\n"
                    "Please upgrade your account in the web dashboard or use manual uploads for your free audit."
                )
            return

        gemini = GeminiService()

        # Gather extraction tasks
        extraction_targets = []
        if pdfs:
            for filename, pdf_bytes in pdfs:
                extraction_targets.append({"name": filename, "pdf": pdf_bytes, "text": None})
        elif text_content:
            extraction_targets.append({"name": "Email Body", "pdf": None, "text": text_content})

        for target in extraction_targets:
            filename = target["name"]
            try:
                logger.info("Processing '%s' from %s for user %s", filename, sender, user_id)

                # 1. Extract invoice data with Gemini
                extraction = await gemini.extract_invoice(
                    pdf_bytes=target["pdf"], 
                    text_content=target["text"]
                )

                # 2. Save and compare
                try:
                    price_engine = PriceEngine(self.sb, gemini=gemini)

                    location_id = None
                    if user and user.locations:
                        location_id = user.locations[0].id

                    invoice = Invoice(
                        user_id=user_id,
                        vendor_name=extraction.vendor_name,
                        invoice_date=extraction.invoice_date,
                        items=extraction.items,
                        location_id=location_id,
                    )
                    self.sb.save_invoice(invoice)

                    # 3. Compare prices against baseline
                    price_alert = await price_engine.compare_prices(extraction, user_id)

                    # 4. Dispatch alerts
                    if user:
                        await notifier.dispatch_alert(
                            price_alert,
                            telegram_chat_id=user.telegram_chat_id,
                            whatsapp_number=user.whatsapp_number,
                            onesignal_player_id=getattr(user, "onesignal_player_id", None),
                            user_uid=user_id,
                            user_email=user.email,
                            alert_email=getattr(user, "alert_email", None),
                            slack_webhook_url=getattr(user, "slack_webhook_url", None),
                            alert_channels=getattr(user, "alert_channels", None),
                        )

                    # 5. Update baseline (only if it's the latest)
                    self.sb.save_baseline(user_id, extraction.vendor_name, extraction.items, extraction.invoice_date)

                    logger.info(
                        "Processed invoice: vendor=%s, items=%d, hikes=%d",
                        extraction.vendor_name,
                        len(extraction.items),
                        len(price_alert.flagged_items),
                    )
                except Exception as exc:
                    logger.error("Database operations failed for %s: %s", filename, exc)

            except Exception as exc:
                logger.error("Failed to process PDF '%s': %s", filename, exc)

    async def poll_once(self) -> int:
        """Poll the inbox once. Returns count of processed emails."""
        if not self.is_configured:
            return 0

        processed = 0
        mail = None
        try:
            mail = self._connect()
            mail.select("INBOX")

            # Search for unread emails
            status, msg_ids = mail.search(None, "UNSEEN")
            if status != "OK" or not msg_ids[0]:
                return 0

            email_ids = msg_ids[0].split()
            logger.info("Found %d unread email(s)", len(email_ids))

            for eid in email_ids:
                try:
                    status, msg_data = mail.fetch(eid, "(RFC822)")
                    if status != "OK":
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    subject = self._decode_header_value(msg.get("Subject", ""))
                    sender = msg.get("From", "")
                    if "<" in sender:
                        sender = sender.split("<")[1].rstrip(">")

                    body = self._get_body_text(msg)
                    pdfs = self._extract_pdfs(msg)

                    should_process = False
                    if pdfs:
                        should_process = True
                    elif self._is_invoice_email(subject, body) and len(body) > 100:
                        should_process = True

                    if not should_process:
                        logger.debug("Skipping email from %s: No PDFs and body doesn't look like an invoice.", sender)
                        continue

                    logger.info(
                        "Processing email — from: %s, subject: '%s', PDFs: %d, Body Length: %d",
                        sender, subject, len(pdfs), len(body)
                    )

                    await self._process_email(
                        sender=sender, 
                        subject=subject, 
                        pdfs=pdfs if pdfs else None, 
                        text_content=body if not pdfs else None
                    )
                    processed += 1

                    # Mark as read
                    mail.store(eid, "+FLAGS", "\\Seen")

                except Exception as exc:
                    logger.error("Error processing email ID %s: %s", eid, exc)

        except imaplib.IMAP4.error as exc:
            logger.error("IMAP error: %s", exc)
        except Exception as exc:
            logger.error("Email polling error: %s", exc)
        finally:
            if mail:
                try:
                    mail.logout()
                except Exception:
                    pass

        return processed

    async def start_polling(self) -> None:
        """Start the background polling loop."""
        if not self.is_configured:
            logger.info(
                "Email ingestion not configured (INGESTION_EMAIL not set). "
                "Skipping IMAP polling."
            )
            return

        self._running = True
        interval = self.settings.ingestion_poll_interval
        logger.info(
            "📧 EmailIngestionService started polling %s every %ds",
            self.settings.ingestion_email,
            interval,
        )

        while self._running:
            try:
                count = await self.poll_once()
                if count > 0:
                    logger.info("Processed %d email(s) this cycle", count)
            except Exception as exc:
                logger.error("Polling cycle error: %s", exc)

            await asyncio.sleep(interval)

    def stop(self) -> None:
        """Stop the polling loop."""
        self._running = False
        logger.info("EmailIngestionService stopped")
