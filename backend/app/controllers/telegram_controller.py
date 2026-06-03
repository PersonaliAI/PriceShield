"""Telegram bot controller — webhook for account linking and interactive alerts."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from app.middleware.auth import get_current_user_uid
from app.config import get_settings
from app.services.supabase_service import SupabaseService
from app.services.notification_service import NotificationService
from app.services.gemini_service import GeminiService
from app.services.ai_cfo_service import AICFOService
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["Telegram"])

settings = get_settings()


@router.post("/telegram", summary="Telegram Bot webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receives updates from Telegram Bot API.
    Handles:
      - /start <uid>  → links Telegram account to PriceShield user
      - /status        → shows connection status
      - PROOF          → shows detailed flagged items for last alert
      - /help          → shows help text
    """
    try:
        update = await request.json()
        logger.info("Telegram update received: %s", update)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    message = update.get("message")
    if not message:
        return {"ok": True}

    chat_id = str(message["chat"]["id"])
    text = (message.get("text") or "").strip()
    first_name = message.get("from", {}).get("first_name", "there")
    logger.info("Telegram message from %s (%s): %s", first_name, chat_id, text)

    notifier = NotificationService()
    supabase = SupabaseService()
    
    # Snap & Send — Handle Photos/Documents
    file_id = None
    file_type = None
    
    if message.get("photo"):
        file_id = message["photo"][-1]["file_id"]
        file_type = "photo"
    elif message.get("document"):
        doc = message["document"]
        supported_mimes = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"]
        if doc.get("mime_type") in supported_mimes:
            file_id = doc["file_id"]
            file_type = "document"

    if file_id:
        user_uid = supabase.get_user_uid_by_telegram_id(chat_id)
        if user_uid:
            mime_type = "image/jpeg"
            if message.get("document"):
                mime_type = message["document"].get("mime_type", "application/pdf")
            
            await notifier.send_telegram(chat_id, "🔍 *I've received your invoice.* Analyzing for price hikes now...")
            background_tasks.add_task(handle_telegram_file, chat_id, user_uid, file_id, mime_type)
        else:
            await notifier.send_telegram(chat_id, "👋 Welcome! Please link your account first using the link in your Settings page.")
        return {"ok": True}
    
    try:
        # /start <uid> — Link Telegram to PriceShield account
        if text.startswith("/start"):
            parts = text.split()
            if len(parts) < 2:
                await notifier.send_telegram(
                    chat_id,
                    "👋 Welcome to PriceShield!\n\n"
                    "To link your account, use the link from your PriceShield Settings page.\n"
                    "It will look like: `/start YOUR_USER_ID`",
                )
                return {"ok": True}

            uid = parts[1]
            try:
                user = supabase.get_user(uid)
                
                from app.models.user import SubscriptionTier
                if user and getattr(user, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
                    await notifier.send_telegram(
                        chat_id,
                        "🔒 Telegram alerts and the AI CFO are available on the Pro Shield tier.\n\n"
                        "Please upgrade your account in the web dashboard to link your bot."
                    )
                    return {"ok": True}

                if not user:
                    logger.info("Auto-creating user profile for uid: %s", uid)
                    user = User(uid=uid, email="")
                    supabase.save_user(user)

                # Link account
                supabase.update_user(uid, {"telegram_chat_id": chat_id})
                
                await notifier.send_telegram(
                    chat_id,
                    f"✅ Linked! Hey {first_name}, your PriceShield account is now connected.\n\n"
                    f"You'll receive real-time alerts here whenever we detect a price hike "
                    f"on your supplier invoices.\n\n"
                    f"Commands:\n"
                    f"/status — Check your connection\n"
                    f"/help — Show this menu",
                )
                logger.info("Telegram linked: chat_id=%s → uid=%s", chat_id, uid)
            except Exception as exc:
                logger.error("Telegram link failed: %s", exc, exc_info=True)
                await notifier.send_telegram(chat_id, "⚠️ Something went wrong while linking your account. Please try again later.")

            return {"ok": True}

        # /status — Connection status
        if text.startswith("/status"):
            try:
                user_res = supabase.client.table("profiles").select("*").eq("telegram_chat_id", chat_id).limit(1).execute()
                user_doc = user_res.data[0] if user_res.data else None

                if user_doc:
                    await notifier.send_telegram(
                        chat_id,
                        f"✅ Connected to PriceShield\n"
                        f"📧 Account: {user_doc.get('email', 'N/A')}\n"
                        f"📊 Invoices processed: {user_doc.get('invoices_uploaded', 0)}\n"
                        f"🔔 Alerts: Active",
                    )
                else:
                    await notifier.send_telegram(
                        chat_id,
                        "❌ Not linked. Use the link from your PriceShield Settings page to connect.",
                    )
            except Exception as exc:
                logger.error("Status check failed: %s", exc, exc_info=True)
                await notifier.send_telegram(chat_id, "⚠️ Could not check status. Try again later.")

            return {"ok": True}

        # /stop or /disconnect — Unlink Telegram
        if text.startswith("/stop") or text.startswith("/disconnect"):
            try:
                user_uid = supabase.get_user_uid_by_telegram_id(chat_id)

                if user_uid:
                    supabase.clear_user_field(user_uid, "telegram_chat_id")
                    await notifier.send_telegram(
                        chat_id,
                        "👋 Disconnected. Your Telegram account has been unlinked from PriceShield.\n\n"
                        "You will no longer receive alerts here. To reconnect, use the link in your Settings page."
                    )
                    logger.info("Telegram unlinked: chat_id=%s, uid=%s", chat_id, user_uid)
                else:
                    await notifier.send_telegram(
                        chat_id,
                        "❌ You are not linked to any PriceShield account."
                    )
            except Exception as exc:
                logger.error("Disconnect failed: %s", exc, exc_info=True)
                await notifier.send_telegram(chat_id, "⚠️ Could not disconnect. Please try again later.")

            return {"ok": True}

        # /help
        if text.startswith("/help"):
            await notifier.send_telegram(
                chat_id,
                "<b>🛡️ PriceShield Bot</b>\n\n"
                "I monitor your supplier invoices and alert you when prices change.\n\n"
                "<b>Commands:</b>\n"
                "/start &lt;uid&gt; — Link your account\n"
                "/status — Check connection\n"
                "/stop — Disconnect your account\n"
                "/help — Show this menu\n\n"
                "<b>How it works:</b>\n"
                "1. Forward supplier invoices to your PriceShield email\n"
                "2. AI extracts every line item\n"
                "3. I alert you here if any prices went up &gt; 2%",
            )
            return {"ok": True}

        # PROOF — Detailed breakdown of last price hike
        if text.upper().startswith("PROOF"):
            try:
                user_uid = supabase.get_user_uid_by_telegram_id(chat_id)
                if not user_uid:
                    await notifier.send_telegram(chat_id, "You are not linked. Use your Settings page link to connect first.")
                    return {"ok": True}

                from app.models.user import SubscriptionTier
                u = supabase.get_user(user_uid)
                if u and getattr(u, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
                    await notifier.send_telegram(chat_id, "🔒 PROOF command is a Pro Shield feature. Please upgrade your account to access.")
                    return {"ok": True}

                parts = text.split()
                vendor_filter = parts[1].upper() if len(parts) > 1 else None
                
                alerts = supabase.get_alerts(user_uid, limit=50)
                hike_alerts = [a for a in alerts if a.has_hikes and len(a.flagged_items) > 0]
                
                if not hike_alerts:
                    await notifier.send_telegram(chat_id, "No recent price hike alerts found. Your margins are clean! ✅")
                    return {"ok": True}

                target_alert = None
                if vendor_filter:
                    target_alert = next((a for a in hike_alerts if vendor_filter in a.vendor_name.upper()), None)
                    if not target_alert:
                        recent_vendors = ", ".join(list(dict.fromkeys(a.vendor_name for a in hike_alerts))[:5])
                        await notifier.send_telegram(chat_id, f"❌ No recent hikes found for '{vendor_filter}'.\n\nRecent hikes detected for: *{recent_vendors}*")
                        return {"ok": True}
                else:
                    target_alert = hike_alerts[0]

                from app.models.invoice import PriceAlert
                pa = PriceAlert(
                    vendor_name=target_alert.vendor_name,
                    invoice_date=target_alert.created_at.date() if hasattr(target_alert.created_at, "date") else target_alert.created_at,
                    flagged_items=target_alert.flagged_items,
                    total_margin_lost=target_alert.total_margin_lost,
                    biggest_jump_item=target_alert.flagged_items[0].item_name if target_alert.flagged_items else None,
                    biggest_jump_pct=max((f.variance_pct for f in target_alert.flagged_items), default=0),
                    has_hikes=True,
                )
                response_text = NotificationService.format_proof(pa)
                
                unique_vendors = []
                last_seen = set()
                for a in hike_alerts:
                    if a.vendor_name not in last_seen:
                        unique_vendors.append(a)
                        last_seen.add(a.vendor_name)
                    if len(unique_vendors) >= 4:
                        break
                
                if len(unique_vendors) > 1:
                    vendor_links = "\n".join([f"• `PROOF {v.vendor_name.split()[0].upper()}` — {v.vendor_name}" for v in unique_vendors if v.vendor_name != target_alert.vendor_name])
                    if vendor_links:
                        response_text += f"\n\n📎 *Switch Vendor:*\n{vendor_links}"
                
                await notifier.send_telegram(chat_id, response_text)

            except Exception as exc:
                logger.error("Telegram PROOF failed: %s", exc, exc_info=True)
                await notifier.send_telegram(chat_id, "⚠️ Could not retrieve proof. Please try again later.")

            return {"ok": True}

        # Default response — Conversational AI CFO
        try:
            user_uid = supabase.get_user_uid_by_telegram_id(chat_id)
            if user_uid:
                from app.models.user import SubscriptionTier
                u = supabase.get_user(user_uid)
                if u and getattr(u, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
                    await notifier.send_telegram(
                        chat_id,
                        "🔒 The AI CFO is available on the Pro Shield tier. Please upgrade your account to ask questions."
                    )
                    return {"ok": True}

                gemini = GeminiService()
                ai_cfo = AICFOService(supabase, gemini)
                response_text = await ai_cfo.answer_question(user_uid, text)
                await notifier.send_telegram(chat_id, response_text)
            else:
                await notifier.send_telegram(
                    chat_id,
                    f"Hey {first_name}! I'm PriceShield Bot 🛡️\n\n"
                    "I can answer questions about your supplier pricing, but first you need to link your account.\n\n"
                    "Go to your Settings page on the website to get your connection link!"
                )
        except Exception as exc:
            logger.error("AI CFO Telegram error: %s", exc, exc_info=True)
            await notifier.send_telegram(chat_id, "⚠️ I'm having trouble analyzing your data right now. Please try again later.")
    except Exception as exc:
        logger.error("Telegram webhook error: %s", exc, exc_info=True)

    return {"ok": True}


async def handle_telegram_file(chat_id: str, user_uid: str, file_id: str, mime_type: str):
    """Downloads and processes an invoice file from Telegram."""
    try:
        from app.services.price_engine import PriceEngine
        from app.controllers.ingestion_controller import process_invoice_pipeline
        import httpx
        
        supabase = SupabaseService()
        settings = get_settings()
        notifier = NotificationService()
        
        get_file_url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/getFile?file_id={file_id}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(get_file_url)
            file_data = resp.json()
            if not file_data.get("ok"):
                logger.error("Telegram getFile failed: %s", file_data)
                return
            
            file_path = file_data["result"]["file_path"]
            download_url = f"https://api.telegram.org/file/bot{settings.telegram_bot_token}/{file_path}"
            
            resp = await client.get(download_url)
            resp.raise_for_status()
            file_content = resp.content
            
        user = supabase.get_user(user_uid)
        gemini = GeminiService()
        price_engine = PriceEngine(supabase, gemini=gemini, threshold_pct=user.alert_threshold)
        
        result = await process_invoice_pipeline(
            file_content, user_uid, supabase, gemini, price_engine, notifier, mime_type=mime_type
        )
        
        if result["status"] == "success":
            pass
        else:
            await notifier.send_telegram(chat_id, f"❌ *Failed to process:* {result['message']}")
            
    except Exception as exc:
        logger.error("Telegram file processing failed: %s", exc, exc_info=True)
        notifier = NotificationService()
        await notifier.send_telegram(chat_id, "⚠️ Something went wrong while processing your file. Please ensure it's a clear invoice photo or PDF.")


@router.post("/telegram/disconnect", summary="Disconnect Telegram account")
async def disconnect_telegram(
    user_id: str = Depends(get_current_user_uid),
):
    """Authenticated endpoint for the website to disconnect the Telegram bot."""
    try:
        supabase = SupabaseService()
        user = supabase.get_user(user_id)
        chat_id = user.telegram_chat_id if user else None
        
        supabase.clear_user_field(user_id, "telegram_chat_id")
        
        if chat_id:
            notifier = NotificationService()
            await notifier.send_telegram(
                chat_id,
                "👋 Disconnected. Your Telegram account has been unlinked from PriceShield via the website."
            )
            
        logger.info("Telegram unlinked via web: uid=%s", user_id)
        return {"status": "disconnected"}
    except Exception as exc:
        logger.error("Web disconnect failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to disconnect Telegram")


@router.get("/telegram/setup", summary="Get Telegram bot setup info")
async def telegram_setup_info():
    """Return the Telegram bot setup webhook URL for configuration."""
    return {
        "bot_configured": bool(settings.telegram_bot_token),
        "webhook_url": "/webhook/telegram",
        "instructions": (
            "1. Create a bot via @BotFather on Telegram\n"
            "2. Set TELEGRAM_BOT_TOKEN in .env\n"
            "3. Set webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook "
            "with {url: 'https://your-domain.com/webhook/telegram'}"
        ),
    }
