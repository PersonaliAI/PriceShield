from __future__ import annotations
from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN, HTTP_429_TOO_MANY_REQUESTS

from app.models.api_models import APIKey
from app.services.api_key_service import APIKeyService

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(raw_key: str = Security(api_key_header)) -> APIKey:
    """
    FastAPI dependency that:
    1. Validates the raw API key against Firestore/Supabase
    2. Checks monthly quota
    3. Returns the APIKey object for downstream use
    """
    if not raw_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail={
                "error": "api_key_missing",
                "message": "Include your API key in the X-API-Key header.",
                "docs": "https://trypriceshield.com/docs/api"
            }
        )

    svc = APIKeyService()
    api_key = svc.validate_key(raw_key)
    if not api_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail={
                "error": "api_key_invalid",
                "message": "The API key provided is invalid or has been revoked."
            }
        )

    # Check quota for extract endpoint
    allowed, reason = svc.check_quota(api_key, endpoint="/api/v1/extract")
    if not allowed:
        raise HTTPException(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "quota_exceeded",
                "message": reason or "Monthly extraction quota exceeded.",
                "upgrade_url": "https://trypriceshield.com/dashboard/api"
            }
        )

    return api_key
