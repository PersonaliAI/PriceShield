from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class SubscriptionTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    MULTI = "multi"
    DEVELOPER = "developer"

class Location(BaseModel):
    id: str = Field(default_factory=lambda: datetime.utcnow().strftime('%Y%m%d%H%M%S'))
    name: str
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    uid: str = Field(..., description="Firebase Auth UID")
    email: str
    display_name: Optional[str] = None
    tier: SubscriptionTier = SubscriptionTier.FREE
    api_keys: list[str] = Field(default_factory=list, description="Firestore API key document IDs")
    telegram_chat_id: Optional[str] = None
    whatsapp_number: Optional[str] = None
    forwarding_emails: list[str] = Field(default_factory=list)
    alert_email: Optional[str] = None
    onesignal_player_id: Optional[str] = None
    alert_channels: list[str] = Field(default_factory=lambda: ["email", "push"])
    report_daily: bool = True
    report_weekly: bool = True
    report_monthly: bool = True
    onboarding_complete: bool = False
    invoices_uploaded: int = 0
    manual_uploads_count: int = 0
    alert_threshold: float = 2.0
    slack_webhook_url: Optional[str] = None
    slack_user_id: Optional[str] = None
    slack_team_id: Optional[str] = None
    locations: list[Location] = Field(default_factory=lambda: [Location(id="main", name="Main Location")])
    ls_customer_id: Optional[str] = None
    ls_subscription_id: Optional[str] = None
    ls_subscription_status: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    country: Optional[str] = None
    timezone: Optional[str] = None

    class Config:
        use_enum_values = True
