from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AttachmentMetadata(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    storage_path: Optional[str] = None
    signed_url: Optional[str] = None

class InboxMessage(BaseModel):
    id: Optional[str] = None
    user_id: str
    from_email: str
    to_email: str
    subject: str = ""
    text_body: str = ""
    html_body: str = ""
    has_attachments: bool = False
    attachments: list[AttachmentMetadata] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
