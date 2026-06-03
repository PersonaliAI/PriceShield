from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    id: Optional[str] = None
    user_id: str
    role: ChatRole
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
