from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class APIKeyTier(str, Enum):
    FREE = "api_free"
    PRO = "api_pro"
    SCALE = "api_scale"
    ENTERPRISE = "api_enterprise"

API_TIER_LIMITS = {
    APIKeyTier.FREE: {
        "label": "Developer Free",
        "price": 0,
        "rate_limit_per_min": 10,
        "monthly_extractions": 50,
        "monthly_comparisons": 50
    },
    APIKeyTier.PRO: {
        "label": "Developer Pro",
        "price": 99,
        "rate_limit_per_min": 60,
        "monthly_extractions": 2000,
        "monthly_comparisons": 5000
    },
    APIKeyTier.SCALE: {
        "label": "Developer Scale",
        "price": 299,
        "rate_limit_per_min": 200,
        "monthly_extractions": 10000,
        "monthly_comparisons": 25000
    },
    APIKeyTier.ENTERPRISE: {
        "label": "Enterprise",
        "price": -1,
        "rate_limit_per_min": 1000,
        "monthly_extractions": 999999,
        "monthly_comparisons": 999999
    }
}

class APIKey(BaseModel):
    id: Optional[str] = Field(None, description="Firestore document ID")
    user_id: str = Field(..., description="Owner's Firebase Auth UID")
    key_hash: str = Field(..., description="SHA-256 hash of the raw key (never store raw)")
    key_prefix: str = Field(..., description="First 8 chars of the key for display (ps_live_xxxx...)")
    name: str = Field("Default", description="Human-friendly label")
    tier: APIKeyTier = APIKeyTier.FREE
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    total_requests: int = 0
    monthly_requests: int = 0
    monthly_reset_date: str = Field(
        default_factory=lambda: datetime.utcnow().strftime('%Y-%m-01'), 
        description="YYYY-MM-01 of the current billing cycle"
    )

    class Config:
        use_enum_values = True

class UsageRecord(BaseModel):
    api_key_id: str
    user_id: str
    endpoint: str
    method: str = "POST"
    status_code: int
    latency_ms: int
    file_size_bytes: int = 0
    items_extracted: int = 0
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UsageSummary(BaseModel):
    api_key_id: str
    key_name: str = ""
    tier: str = ""
    period_start: str = ""
    period_end: str = ""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_extractions: int = 0
    total_comparisons: int = 0
    avg_latency_ms: float = 0.0
    total_bytes_processed: int = 0
    quota_used_pct: float = 0.0

class APIKeyResponse(BaseModel):
    id: str
    raw_key: str = Field(..., description="Full API key — shown only on creation")
    name: str
    tier: str
    created_at: datetime

class APIKeyListItem(BaseModel):
    id: str
    name: str
    key_prefix: str
    tier: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    total_requests: int = 0
    monthly_requests: int = 0
