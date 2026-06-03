from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from app.models.invoice import PriceFlag

class AlertType(str, Enum):
    PRICE_HIKE = "price_hike"
    ALL_CLEAR = "all_clear"
    HISTORICAL_AUDIT = "historical_audit"

class Alert(BaseModel):
    id: Optional[str] = Field(None, description="Firestore document ID")
    user_id: str
    alert_type: AlertType
    vendor_name: str
    message: str = Field(..., description="Formatted alert message sent to user")
    flagged_items: list[PriceFlag] = Field(default_factory=list)
    total_margin_lost: float = Field(0.0)
    has_hikes: bool = Field(True)
    channel: str = Field("telegram", description="telegram | whatsapp | email")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
