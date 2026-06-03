"""Slack bot controller — handles inbound events from Slack."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks, Depends
from fastapi.responses import RedirectResponse

from app.services.supabase_service import SupabaseService
from app.services.slack_service import SlackService
from app.services.gemini_service import GeminiService
from app.services.ai_cfo_service import AICFOService
from app.services.notification_service import NotificationService
from app.services.price_engine import PriceEngine
from app.middleware.auth import get_current_user_uid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook/slack", tags=["Slack"])


@router.post("", summary="Slack Event Hook")
async def slack_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_slack_signature: str = Header(None),
    x_slack_request_timestamp: str = Header(None),
):
    """Main Slack entry point. Handles URL verification and event dispatching."""
    body = await request.body()
    slack_service = SlackService()

    # Verify Signature
    if not slack_service.verify_signature(x_slack_request_timestamp, body, x_slack_signature):
        logger.warning("Slack signature verification failed.")
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()

    # Handle URL Verification (Challenge)
    if data.get("type") == "url_verification":
        return {"challenge": data.get("challenge")}

    event = data.get("event", {})
    
    # Ignore bot messages to avoid loops
    if event.get("bot_id"):
        return {"ok": True}

    background_tasks.add_task(handle_slack_event, event)

    return {"ok": True}


async def handle_slack_event(event: dict[str, Any]):
    """Processes Slack events in the background."""
    event_type = event.get("type")
    
    supported_events = ["message", "app_mention"]
    if event_type not in supported_events:
        return

    slack_user_id = event.get("user") or event.get("user_id")
    if not slack_user_id:
        return

    channel = event.get("channel")
    text = event.get("text", "").strip()

    supabase = SupabaseService()
    slack_service = SlackService()
    
    # Identity Matching
    user = supabase.get_user_by_slack_id(slack_user_id)
    
    # Handle Linking Command: /shield link <uid>
    if text.startswith("/shield link"):
        parts = text.split()
        if len(parts) >= 3:
            target_uid = parts[2]
            try:
                target_user = supabase.get_user(target_uid)
                if target_user:
                    supabase.update_user(target_uid, {
                        "slack_user_id": slack_user_id, 
                        "slack_team_id": event.get("team")
                    })
                    await slack_service.post_message(channel, f"✅ *Linked!* Your Slack account is now connected to PriceShield ({target_user.email}).")
                else:
                    await slack_service.post_message(channel, f"❌ *Link Failed:* User ID `{target_uid}` not found.")
            except Exception as e:
                logger.error("Slack link failed: %s", e)
                await slack_service.post_message(channel, "⚠️ Something went wrong while linking. Please try again.")
        else:
            await slack_service.post_message(channel, "💡 *How to link:* Use `/shield link YOUR_UID`. You can find your UID in the Settings page of the dashboard.")
        return

    # Auto-linking attempt
    if not user:
        email = await slack_service.get_user_email(slack_user_id)
        if email:
            target_uid = supabase.find_user_uid_by_email(email)
            if target_uid:
                supabase.update_user(target_uid, {"slack_user_id": slack_user_id})
                user = supabase.get_user(target_uid)
                logger.info("Auto-linked Slack user %s to UID %s via email %s", slack_user_id, target_uid, email)

    if not user:
        is_dm = event.get("channel_type") == "im"
        is_mention = event_type == "app_mention"
        
        if is_dm or is_mention:
            await slack_service.post_message(
                channel,
                "👋 Welcome to PriceShield! Your Slack account is not linked to a PriceShield account.\n\n"
                "Please go to your **Settings** page on the PriceShield dashboard to connect your Slack."
            )
        return

    # Handle Direct Messages (AI CFO Chat)
    if event_type == "message" and not event.get("files"):
        gemini = GeminiService()
        ai_cfo = AICFOService(supabase, gemini)
        answer = await ai_cfo.answer_question(user.uid, text)
        await slack_service.post_message(channel, answer)
        return

    # Handle File Uploads (Snap & Send)
    if event_type == "message" and event.get("files"):
        files = event.get("files", [])
        for file_info in files:
            file_type = file_info.get("mimetype", "")
            if "pdf" in file_type or "image" in file_type:
                try:
                    from app.controllers.ingestion_controller import process_invoice_pipeline
                    file_content = await slack_service.download_file(file_info.get("url_private"))
                    
                    gemini = GeminiService()
                    price_engine = PriceEngine(supabase, gemini=gemini, threshold_pct=user.alert_threshold)
                    notifier = NotificationService()
                    
                    await slack_service.post_message(channel, f"🔍 I've received your invoice (*{file_info.get('name')}*). Analyzing for price hikes now...")
                    
                    result = await process_invoice_pipeline(
                        file_content, user.uid, supabase, gemini, price_engine, notifier, mime_type=file_type
                    )
                    
                    if result["status"] == "success":
                        pass
                    else:
                        await slack_service.post_message(channel, f"❌ *Failed to process:* {result['message']}")
                        
                except Exception as exc:
                    logger.error("Slack file processing failed: %s", exc)
                    await slack_service.post_message(channel, "❌ Something went wrong while processing your file. Please ensure it's a clear invoice photo or PDF.")


@router.get("/install", summary="Start Slack OAuth flow")
async def slack_install(uid: str):
    """Redirects the user to Slack for app installation/linking."""
    from app.config import get_settings
    settings = get_settings()
    
    if not settings.slack_client_id:
        raise HTTPException(status_code=500, detail="Slack OAuth client ID not configured")
        
    scopes = "chat:write,files:read,users:read,users:read.email,im:history,app_mentions:read"
    slack_url = (
        f"https://slack.com/oauth/v2/authorize"
        f"?client_id={settings.slack_client_id}"
        f"&scope={scopes}"
        f"&redirect_uri={settings.slack_redirect_uri}"
        f"&state={uid}"
    )
    return RedirectResponse(slack_url)


@router.get("/oauth", summary="Slack OAuth callback")
async def slack_oauth_callback(code: str, state: str):
    """Handles the Slack OAuth callback, exchanges code for token, and links account."""
    slack_service = SlackService()
    supabase = SupabaseService()
    
    result = await slack_service.exchange_oauth_code(code)
    if not result:
        return RedirectResponse("https://trypriceshield.com/dashboard/settings?slack=error")
        
    slack_user_id = result.get("authed_user", {}).get("id")
    slack_team_id = result.get("team", {}).get("id")
    
    if slack_user_id:
        supabase.update_user(state, {
            "slack_user_id": slack_user_id,
            "slack_team_id": slack_team_id
        })
        logger.info("Slack OAuth linked: uid=%s -> slack_user=%s", state, slack_user_id)
        return RedirectResponse("https://trypriceshield.com/dashboard/settings?slack=success")
    
    return RedirectResponse("https://trypriceshield.com/dashboard/settings?slack=error")


@router.post("/disconnect", summary="Disconnect Slack account")
async def disconnect_slack(
    user_id: str = Depends(get_current_user_uid),
):
    """Authenticated endpoint for the website to disconnect the Slack bot."""
    try:
        supabase = SupabaseService()
        user = supabase.get_user(user_id)
        slack_user_id = user.slack_user_id if user else None
        
        supabase.update_user(user_id, {
            "slack_user_id": None,
            "slack_team_id": None
        })
        
        if slack_user_id:
            slack_service = SlackService()
            await slack_service.post_message(
                slack_user_id,
                "👋 Disconnected. Your Slack account has been unlinked from PriceShield via the website."
            )
            
        logger.info("Slack unlinked via web: uid=%s", user_id)
        return {"status": "disconnected"}
    except Exception as exc:
        logger.error("Web disconnect failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to disconnect Slack")
