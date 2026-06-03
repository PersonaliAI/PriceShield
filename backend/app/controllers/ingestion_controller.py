"""Ingestion controller — receives forwarded invoices via email webhook."""

from __future__ import annotations

import base64
import logging
import re
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Form, Request, BackgroundTasks
from pydantic import BaseModel, Field

from app.middleware.auth import get_current_user_uid
from app.models.alert import Alert, AlertType
from app.models.invoice import Invoice
from app.models.inbox import InboxMessage
from app.services.supabase_service import SupabaseService
from app.services.gemini_service import GeminiService
from app.services.notification_service import NotificationService
from app.services.price_engine import PriceEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["Ingestion"])


def find_best_location_match(user: Any, extracted_address: Optional[str]) -> Optional[str]:
    """
    Fuzzy match extracted address against user's registered locations.
    Returns the location_id of the best match, or the first location as fallback.
    """
    if not user.locations:
        return None
        
    if not extracted_address or extracted_address.lower().strip() in ["n/a", "none", "unknown", "null"]:
        return user.locations[0].id

    import difflib
    
    best_match = None
    highest_score = 0.0
    addr_clean = extracted_address.lower().strip()
    
    for loc in user.locations:
        loc_name_clean = loc.name.lower().strip()
        loc_addr_clean = (loc.address or "").lower().strip()
        
        # 1. Exact or Substring match (Name or Address)
        if (loc_name_clean in addr_clean or addr_clean in loc_name_clean) or \
           (loc_addr_clean and (loc_addr_clean in addr_clean or addr_clean in loc_addr_clean)):
            return loc.id
            
        # 2. Fuzzy similarity (SequenceMatcher)
        name_score = difflib.SequenceMatcher(None, addr_clean, loc_name_clean).ratio()
        addr_score = difflib.SequenceMatcher(None, addr_clean, loc_addr_clean).ratio() if loc.address else 0
        
        score = max(name_score, addr_score)
        if score > highest_score:
            highest_score = score
            best_match = loc.id

    if highest_score > 0.6:
        return best_match
        
    if len(user.locations) == 1:
        logger.info("Single location fallback used for location matching.")
        return user.locations[0].id

    return None


async def process_invoice_pipeline(
    pdf_bytes: bytes,
    user_id: str,
    supabase: SupabaseService,
    gemini: GeminiService,
    price_engine: PriceEngine,
    notifier: NotificationService,
    mime_type: str = "application/pdf"
) -> dict:
    """
    Reusable pipeline to:
    1. Extract with Gemini
    2. Save to Supabase
    3. Compare prices
    4. Dispatch alerts
    5. Save alert record
    6. Update baseline
    """
    try:
        # 1. Extract with Gemini
        extraction = await gemini.extract_invoice(pdf_bytes, mime_type=mime_type)

        # 2. Match Location & Enforce Tier Limits
        user = supabase.get_user(user_id)
        location_id = find_best_location_match(user, extraction.customer_address) if user else None
        
        from app.models.user import SubscriptionTier
        is_multi = user and user.tier == SubscriptionTier.MULTI
        
        if extraction.customer_address and location_id is None and not is_multi:
            error_msg = (
                "⚠️ *Location Mismatch Detected*\n\n"
                f"The invoice for *{extraction.vendor_name}* has a delivery address that doesn't match your registered site:\n\n"
                f"`{extraction.customer_address}`\n\n"
                "Your current plan is limited to *1 Restaurant Location*. This invoice was not processed to prevent data corruption.\n\n"
                "Please upgrade to *Multi-Location* or update your address in Settings."
            )
            logger.warning("Location mismatch blocked for user %s (Tier: %s). Address: %s", 
                           user_id, user.tier if user else "Unknown", extraction.customer_address)
            
            if user and user.telegram_chat_id:
                await notifier.send_telegram(user.telegram_chat_id, error_msg)
            if user and user.whatsapp_number:
                await notifier.send_whatsapp(user.whatsapp_number, error_msg)
                
            return {"status": "error", "message": "Location mismatch. Your plan only supports 1 location."}

        # Duplicate Detection
        if supabase.is_duplicate_invoice(user_id, extraction.vendor_name, extraction.invoice_number, extraction.invoice_date):
            logger.warning("Duplicate invoice detected: %s - %s", extraction.vendor_name, extraction.invoice_number)
            if user:
                duplicate_msg = (
                    f"⚠️ *Duplicate Invoice Detected*\n\n"
                    f"The invoice for *{extraction.vendor_name}* (#{extraction.invoice_number}) has already been processed.\n\n"
                    "We've skipped this upload to keep your data clean."
                )
                if user.telegram_chat_id:
                    await notifier.send_telegram(user.telegram_chat_id, duplicate_msg)
            return {"status": "duplicate", "message": "Invoice already processed."}

        # Save Invoice & Compare
        invoice = Invoice(
            user_id=user_id,
            invoice_number=extraction.invoice_number,
            vendor_name=extraction.vendor_name,
            vendor_address=extraction.vendor_address,
            vendor_tax_id=extraction.vendor_tax_id,
            customer_name=extraction.customer_name,
            customer_address=extraction.customer_address,
            invoice_date=extraction.invoice_date,
            items=extraction.items,
            subtotal=extraction.subtotal,
            tax_total=extraction.tax_total,
            grand_total=extraction.grand_total,
            currency=extraction.currency,
            notes=extraction.notes,
            location_id=location_id,
        )
        invoice_id = supabase.save_invoice(invoice)

        # 3. Compare prices
        price_alert = await price_engine.compare_prices(extraction, user_id)

        # 4. Get user for notification channels
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
                slack_channel_id=getattr(user, "slack_user_id", None),
                alert_channels=getattr(user, "alert_channels", None),
            )

        # 6. Save alert record
        from app.models.alert import Alert, AlertType
        alert = Alert(
            user_id=user_id,
            alert_type=AlertType.PRICE_HIKE if price_alert.has_hikes else AlertType.ALL_CLEAR,
            vendor_name=extraction.vendor_name,
            message=NotificationService.format_hike_alert(price_alert)
            if price_alert.has_hikes
            else NotificationService.format_all_clear(extraction.vendor_name),
            flagged_items=price_alert.flagged_items,
            total_margin_lost=price_alert.total_margin_lost,
        )
        supabase.save_alert(alert)

        # 7. Update baseline with latest prices (if it's the latest one)
        supabase.save_baseline(user_id, extraction.vendor_name, extraction.items, extraction.invoice_date)

        logger.info(
            "Background processing complete: user=%s, vendor=%s, hikes=%d",
            user_id, extraction.vendor_name, len(price_alert.flagged_items)
        )
        return {"status": "success", "invoice_id": invoice_id}
    except Exception as exc:
        logger.exception("Pipeline failed for user %s: %s", user_id, exc)
        
        user = supabase.get_user(user_id)
        if user:
            error_detail = str(exc)
            fail_msg = (
                "❌ *Invoice Processing Failed*\n\n"
                "We encountered an error while processing your invoice:\n\n"
                f"🚨 *Reason*: `{error_detail}`\n\n"
                "Please ensure the file is a valid PDF/Image and the scan is clear. If this persists, contact PriceShield support."
            )
            
            if user.telegram_chat_id:
                await notifier.send_telegram(user.telegram_chat_id, fail_msg)
            if user.whatsapp_number:
                await notifier.send_whatsapp(user.whatsapp_number, fail_msg)
            if user.slack_webhook_url:
                await notifier.send_slack(user.slack_webhook_url, fail_msg)
            elif user.slack_user_id:
                await notifier.send_slack_bot(user.slack_user_id, fail_msg)
        
        return {"status": "error", "message": str(exc)}


class EmailPayload(BaseModel):
    """Schema for the inbound email webhook payload."""
    sender_email: str = Field(..., description="Original sender email address")
    subject: str = Field("", description="Email subject line")
    pdf_base64: str = Field(..., description="Base64-encoded PDF attachment")


@router.post("/email", summary="Receive forwarded invoice email")
async def receive_email(
    payload: EmailPayload,
    user_id: str = Depends(get_current_user_uid),
):
    """
    Main ingestion endpoint:
    1. Decode PDF → Gemini extraction
    2. Save invoice to Supabase
    3. Compare prices against baseline
    4. Dispatch alert
    5. Update baseline
    """
    supabase = SupabaseService()
    user = supabase.get_user(user_id)
    alert_threshold = getattr(user, "alert_threshold", 2.0) if user else 2.0

    gemini = GeminiService()
    price_engine = PriceEngine(supabase, gemini=gemini, threshold_pct=alert_threshold)
    notifier = NotificationService()

    try:
        pdf_bytes = base64.b64decode(payload.pdf_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 PDF: {exc}")

    result = await process_invoice_pipeline(
        pdf_bytes, user_id, supabase, gemini, price_engine, notifier
    )

    if result["status"] == "error":
        raise HTTPException(status_code=422, detail=result["message"])

    return result


@router.post("/sendgrid", summary="SendGrid Inbound Parse Webhook")
async def sendgrid_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    to: str = Form(...),
    from_: str = Form(..., alias="from"),
    subject: str = Form(""),
    text: str = Form(""),
    html: str = Form(""),
):
    """
    Handle incoming emails forwarded to [uid]@priceshield.email.
    Saves the email to the user's Inbox in Supabase.
    """
    try:
        from app.config import get_settings
        cfg = get_settings()
        
        pattern = rf"([a-zA-Z0-9_\-\.]+@{re.escape(cfg.sendgrid_domain)})"
        match = re.search(pattern, to, re.IGNORECASE)
        
        if not match:
            envelope_str = (await request.form()).get("envelope")
            if envelope_str:
                import json
                try:
                    env = json.loads(envelope_str)
                    to_list = env.get("to", [])
                    for addr in to_list:
                        if cfg.sendgrid_domain.lower() in addr.lower():
                            to_email = addr
                            break
                    else:
                        to_email = to_list[0] if to_list else to
                except Exception:
                    to_email = to
            else:
                to_email = to
        else:
            to_email = match.group(1)

        user_id = to_email.split("@")[0]

        supabase = SupabaseService()
        gemini = GeminiService()
        notifier = NotificationService()
        
        user = supabase.get_user(user_id)
        if not user:
            logger.info(f"SendGrid webhook: Initializing first email for new/onboarding user {user_id}")

        message = InboxMessage(
            user_id=user_id,
            from_email=from_,
            to_email=to_email,
            subject=subject,
            text_body=text,
            html_body=html,
            has_attachments=False,
            attachments=[]
        )

        try:
            form_data = await request.form()
            attachment_count_str = form_data.get("attachments", "0")
            try:
                attachment_count = int(attachment_count_str)
            except ValueError:
                attachment_count = 0

            if attachment_count > 0:
                import json
                attachment_info_str = form_data.get("attachment-info", "{}")
                attachment_info = json.loads(attachment_info_str)
                
                for i in range(1, attachment_count + 1):
                    key = f"attachment{i}"
                    upload_file = form_data.get(key)
                    
                    if upload_file and hasattr(upload_file, "filename"):
                        filename = upload_file.filename
                        content_type = upload_file.content_type
                        content = await upload_file.read()
                        size = len(content)
                        
                        storage_path = f"users/{user_id}/inbox/{uuid.uuid4().hex[:8]}_{filename}"
                        
                        try:
                            supabase.upload_file(content, storage_path, content_type)
                            
                            from app.models.inbox import AttachmentMetadata
                            message.attachments.append(AttachmentMetadata(
                                filename=filename,
                                content_type=content_type,
                                size_bytes=size,
                                storage_path=storage_path
                            ))
                            message.has_attachments = True

                            if filename.lower().endswith(".pdf"):
                                from app.models.user import SubscriptionTier
                                if user and getattr(user, "tier", SubscriptionTier.FREE) in [SubscriptionTier.PRO, SubscriptionTier.MULTI]:
                                    background_tasks.add_task(
                                        process_invoice_pipeline,
                                        content,
                                        user_id,
                                        supabase,
                                        gemini,
                                        PriceEngine(supabase, gemini=gemini, threshold_pct=getattr(user, "alert_threshold", 2.0)),
                                        NotificationService(),
                                    )
                                    logger.info(f"Triggered background AI analysis for {filename}")
                                else:
                                    logger.info(f"Skipped AI analysis for {filename} - user {user_id} is on FREE tier.")
                                    if user and user.telegram_chat_id:
                                        background_tasks.add_task(
                                            notifier.send_telegram,
                                            user.telegram_chat_id,
                                            "🔒 *Email Forwarding Blocked*\n\n"
                                            "Your invoices were received via email, but auto-forwarding is a Pro Shield feature.\n\n"
                                            "Please upgrade your account in the web dashboard or use manual uploads for your free audit."
                                        )
                        except Exception as st_err:
                            logger.error(f"Storage upload failed for {filename}: {st_err}")
        except Exception as att_err:
            logger.error(f"Failed to parse attachments: {att_err}")

        msg_id = supabase.save_inbox_message(message)
        logger.info(f"Saved incoming email {msg_id} for user {user_id} (attachments: {len(message.attachments)})")
        
        return {"status": "received", "id": msg_id}

    except Exception as exc:
        logger.error(f"SendGrid webhook failed: {exc}")
        return {"status": "error", "message": str(exc)}
