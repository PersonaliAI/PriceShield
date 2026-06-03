"""AI CFO controller — Web API for conversational financial analysis."""

from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.middleware.auth import get_current_user_uid
from app.services.ai_cfo_service import AICFOService
from app.services.supabase_service import SupabaseService
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai-cfo", tags=["AI CFO"])

_bearer = HTTPBearer(auto_error=False)


async def _get_raw_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    return credentials.credentials


class CFORequest(BaseModel):
    question: str


class ChatMessageEntry(BaseModel):
    role: str
    content: str
    created_at: str


@router.post("/ask", summary="Ask the AI CFO a question (SSE stream)")
async def ask_cfo(
    request: CFORequest,
    user_id: str = Depends(get_current_user_uid),
    token: str = Depends(_get_raw_token),
):
    """Streams SSE events: thinking | tool_start | tool_end | answer | error."""
    supabase = SupabaseService()

    user = supabase.get_user(user_id)
    from app.models.user import SubscriptionTier
    if not user or getattr(user, "tier", SubscriptionTier.FREE) == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=403,
            detail="The AI CFO is a Pro Shield feature. Please upgrade your account to ask questions.",
        )

    gemini = GeminiService()
    ai_cfo = AICFOService(supabase, gemini)

    async def event_stream():
        try:
            async for event in ai_cfo.answer_question_stream(user_id, request.question, token):
                yield f"event: {event['event']}\ndata: {json.dumps(event['data'])}\n\n"
        except Exception as exc:
            logger.error("AI CFO stream error: %s", exc, exc_info=True)
            yield f"event: error\ndata: {json.dumps('An unexpected error occurred. Please try again.')}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/history", response_model=list[ChatMessageEntry], summary="Get AI CFO chat history")
async def get_ai_cfo_history(
    limit: int = 20,
    user_id: str = Depends(get_current_user_uid),
):
    """Returns the latest chat messages for the current user."""
    try:
        supabase = SupabaseService()
        history = supabase.get_chat_history(user_id, limit=limit)
        
        return [
            ChatMessageEntry(
                role=msg.role.value if hasattr(msg.role, "value") else str(msg.role),
                content=msg.content,
                created_at=msg.created_at.isoformat() if msg.created_at else ""
            )
            for msg in history
        ]
    except Exception as exc:
        logger.error("Failed to fetch AI CFO history: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to load chat history")
