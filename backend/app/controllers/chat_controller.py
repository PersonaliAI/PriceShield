"""Chat controller — Telegram/WhatsApp webhook for conversational AI CFO."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.middleware.auth import get_current_user_uid
from app.services.ai_cfo_service import AICFOService
from app.services.supabase_service import SupabaseService
from app.services.gemini_service import GeminiService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["Chat"])


class ChatMessage(BaseModel):
    """Generic inbound chat message (normalised from Telegram/WhatsApp)."""
    platform: str = Field(..., description="'telegram' or 'whatsapp'")
    chat_id: str = Field(..., description="Platform-specific chat/user ID")
    text: str = Field(..., description="User message text")


@router.post("/chat", summary="Handle incoming chat messages")
async def handle_chat(
    message: ChatMessage,
    user_id: str = Depends(get_current_user_uid),
):
    """
    Routes inbound user messages:
    - 'PROOF' → returns the last price hike alert details
    - Anything else → AI CFO conversational analysis
    """
    supabase = SupabaseService()
    notifier = NotificationService()

    user = supabase.get_or_create_user(user_id, "")

    from app.models.user import SubscriptionTier
    if getattr(user, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
        return {"status": "tier_locked", "message": "Pro Shield subscription required."}

    response_text: str

    if message.text.strip().upper() == "PROOF":
        alerts = supabase.get_alerts(user_id, limit=10)
        hike_alert = next(
            (a for a in alerts if a.alert_type == "price_hike"), None
        )
        if hike_alert:
            from app.models.invoice import PriceAlert

            pa = PriceAlert(
                vendor_name=hike_alert.vendor_name,
                invoice_date=hike_alert.created_at.date() if hasattr(hike_alert.created_at, "date") else hike_alert.created_at,
                flagged_items=hike_alert.flagged_items,
                total_margin_lost=hike_alert.total_margin_lost,
                biggest_jump_item=hike_alert.flagged_items[0].item_name if hike_alert.flagged_items else None,
                biggest_jump_pct=max((f.variance_pct for f in hike_alert.flagged_items), default=0),
                has_hikes=True,
            )
            response_text = NotificationService.format_proof(pa)
        else:
            response_text = "No recent price hike alerts found. Your margins have been clean! ✅"
    else:
        gemini = GeminiService()
        ai_cfo = AICFOService(supabase, gemini)
        response_text = await ai_cfo.answer_question(user_id, message.text)

    if message.platform == "telegram":
        await notifier.send_telegram(message.chat_id, response_text)
    elif message.platform == "whatsapp":
        await notifier.send_whatsapp(message.chat_id, response_text)

    return {"status": "replied", "response_length": len(response_text)}


# ------------------------------------------------------------------ #
#  WhatsApp Cloud API Webhook (Meta)
# ------------------------------------------------------------------ #

@router.get("/whatsapp", summary="Verify WhatsApp webhook")
async def verify_whatsapp(request: Request):
    """Mandatory verification for Meta Webhooks."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    VERIFY_TOKEN = "PRICESHIELD_SECRET_2026"

    if mode == "subscribe" and token == VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully!")
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=challenge)
    
    logger.warning("WhatsApp verification failed")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp", summary="Handle WhatsApp incoming messages")
async def whatsapp_webhook(request: Request):
    """Receives incoming WhatsApp messages from Meta."""
    payload = await request.json()
    logger.info("WhatsApp webhook payload: %s", payload)

    try:
        entry = payload["entry"][0]
        change = entry["changes"][0]
        value = change["value"]
        
        if "messages" not in value:
            return {"status": "ignored"}

        msg_obj = value["messages"][0]
        sender_phone = msg_obj["from"]
        text_body = msg_obj.get("text", {}).get("body", "").strip()

        if not text_body:
            return {"status": "no_text"}

        supabase = SupabaseService()
        users = supabase.get_all_users()
        
        normalized_sender = "".join(filter(str.isdigit, sender_phone))
        
        user_uid = None
        for candidate in users:
            if not candidate.whatsapp_number:
                continue
            normalized_candidate = "".join(filter(str.isdigit, candidate.whatsapp_number))
            if normalized_sender == normalized_candidate:
                user_uid = candidate.uid
                break

        notifier = NotificationService()

        if not user_uid:
            await notifier.send_whatsapp(
                sender_phone,
                "👋 Welcome! I don't recognize this number. Please add it to your PriceShield Settings."
            )
            return {"status": "unrecognized_sender"}

        from app.models.user import SubscriptionTier
        u = supabase.get_user(user_uid)
        if u and getattr(u, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
            await notifier.send_whatsapp(
                sender_phone,
                "🔒 WhatsApp features and the AI CFO are available on the Pro Shield plan. Please upgrade your account in the web dashboard."
            )
            return {"status": "tier_locked"}

        if text_body.upper() == "PROOF":
            alerts = supabase.get_alerts(user_uid, limit=10)
            hike_alert = next((a for a in alerts if a.alert_type == "price_hike"), None)
            if hike_alert:
                from app.models.invoice import PriceAlert
                pa = PriceAlert(
                    vendor_name=hike_alert.vendor_name,
                    invoice_date=hike_alert.created_at.date() if hasattr(hike_alert.created_at, "date") else hike_alert.created_at,
                    flagged_items=hike_alert.flagged_items,
                    total_margin_lost=hike_alert.total_margin_lost,
                    biggest_jump_item=hike_alert.flagged_items[0].item_name if hike_alert.flagged_items else None,
                    biggest_jump_pct=max((f.variance_pct for f in hike_alert.flagged_items), default=0),
                    has_hikes=True,
                )
                response_text = NotificationService.format_proof(pa)
                await notifier.send_whatsapp(sender_phone, response_text)
            else:
                await notifier.send_whatsapp(sender_phone, "No recent price hike alerts found. Your margins are clean! ✅")
            return {"status": "replied"}

        gemini = GeminiService()
        ai_cfo = AICFOService(supabase, gemini)
        response_text = await ai_cfo.answer_question(user_uid, text_body)
        
        await notifier.send_whatsapp(sender_phone, response_text)
        return {"status": "replied"}

    except Exception as exc:
        logger.error("WhatsApp webhook error: %s", exc, exc_info=True)
        return {"status": "error"}
