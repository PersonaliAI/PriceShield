"""Inbox controller — API endpoints for user's inbound emails."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import get_current_user_uid
from app.models.inbox import InboxMessage
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/inbox", tags=["Inbox"])


@router.get("", response_model=list[InboxMessage], summary="Get inbox messages")
async def get_inbox_messages(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user_uid)
):
    """Return recent incoming emails for verifying forwarding setup."""
    try:
        supabase = SupabaseService()
        _ = supabase.get_or_create_user(user_id, "")
        messages = supabase.get_inbox_messages(user_id, limit=limit, offset=offset)
        
        # Add signed URLs for attachments
        for msg in messages:
            for att in msg.attachments:
                if att.storage_path:
                    try:
                        att.signed_url = supabase.get_signed_url(att.storage_path)
                    except Exception as e:
                        logger.warning(f"Failed to generate signed URL for {att.storage_path}: {e}")
        
        return messages
    except Exception as exc:
        logger.error("Failed to get inbox messages: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve inbox")
