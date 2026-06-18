"""Public Developer API v1 — invoice extraction and comparison with full telemetry."""

from __future__ import annotations

import time
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from pydantic import BaseModel

from app.models.api_models import APIKey, APIKeyTier, API_TIER_LIMITS
from app.models.invoice import ExtractionResult, PriceAlert
from app.middleware.rate_limiter import check_rate_limit, get_rate_limiter
from app.services.api_key_service import APIKeyService
from app.services.usage_tracker import UsageTracker
from app.services.gemini_service import GeminiService
from app.services.price_engine import PriceEngine
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Developer API"])


def _rate_limit_headers(api_key: APIKey) -> dict[str, str]:
    """Build X-RateLimit-* headers for successful responses."""
    limiter = get_rate_limiter()
    
    tier_enum = api_key.tier
    if isinstance(tier_enum, str):
        tier_enum = APIKeyTier(tier_enum)
        
    limits = API_TIER_LIMITS.get(tier_enum, API_TIER_LIMITS[APIKeyTier.FREE])
    max_rpm = limits.get("rate_limit_per_min", 10)
    
    current_count = len(limiter._windows[api_key.id])
    remaining = max(0, max_rpm - current_count)
    
    oldest = limiter._windows[api_key.id][0] if limiter._windows[api_key.id] else time.time()
    reset = max(1, int(60.0 - (time.time() - oldest)))
    
    return {
        "X-RateLimit-Limit": str(max_rpm),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset)
    }


@router.post("/extract", response_model=ExtractionResult, summary="Extract structured line-item data from an invoice PDF or image.")
async def extract_invoice(
    response: Response,
    file: UploadFile = File(...),
    api_key: APIKey = Depends(check_rate_limit)
):
    """
    Extract structured line-item data from an invoice PDF or image.

    **Authentication:** Include your API key in the `X-API-Key` header.

    **Supported formats:** PDF, PNG, JPEG, WEBP

    **Returns:** Structured JSON with vendor info, line items, totals, and confidence scores.
    """
    start = time.time()
    tracker = UsageTracker()
    key_svc = APIKeyService()
    
    status_code = 200
    error_msg = None
    items_count = 0
    file_size = 0
    
    try:
        ct = file.content_type or ""
        if not (ct == "application/pdf" or ct.startswith("image/")):
            status_code = 400
            error_msg = "Unsupported file type. Upload PDF, PNG, JPEG, or WEBP."
            raise HTTPException(status_code=status_code, detail=error_msg)
            
        content = await file.read()
        file_size = len(content)
        if file_size > 20971520: # 20MB
            status_code = 413
            error_msg = "File too large. Maximum size is 20 MB."
            raise HTTPException(status_code=status_code, detail=error_msg)
            
        gemini = GeminiService()
        result = await gemini.extract_invoice(pdf_bytes=content, mime_type=ct)
        items_count = len(result.items)
        
        headers = _rate_limit_headers(api_key)
        for k, v in headers.items():
            response.headers[k] = v
            
        key_svc.increment_usage(api_key.id)
        return result
        
    except HTTPException as e:
        status_code = e.status_code
        error_msg = e.detail
        raise
    except Exception as e:
        status_code = 500
        error_msg = f"Extraction failed: {str(e)}"
        logger.error("API v1 extract failed: %s", e)
        raise HTTPException(status_code=status_code, detail=error_msg)
    finally:
        latency = int((time.time() - start) * 1000)
        tracker.log_request(
            api_key_id=api_key.id,
            user_id=api_key.user_id,
            endpoint="/api/v1/extract",
            status_code=status_code,
            latency_ms=latency,
            file_size_bytes=file_size,
            items_extracted=items_count,
            error_message=error_msg
        )


@router.post("/public/extract", response_model=ExtractionResult, summary="Free, no-auth endpoint to extract invoice data.")
async def public_extract_invoice(
    file: UploadFile = File(...)
):
    """
    Extract structured line-item data from an invoice PDF or image without an API key.
    Protected by standard network limit. Max 20MB.
    """
    try:
        ct = file.content_type or ""
        if not (ct == "application/pdf" or ct.startswith("image/")):
            raise HTTPException(status_code=400, detail="Unsupported file type. Upload PDF, PNG, JPEG, or WEBP.")
            
        content = await file.read()
        file_size = len(content)
        if file_size > 20971520: # 20MB
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 20 MB.")
            
        gemini = GeminiService()
        result = await gemini.extract_invoice(pdf_bytes=content, mime_type=ct)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Public extract failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.post("/compare", response_model=PriceAlert, summary="Compare extracted invoice data against historical baselines to detect price hikes.")
async def compare_invoice(
    extraction: ExtractionResult,
    response: Response,
    api_key: APIKey = Depends(check_rate_limit)
):
    """
    Compare extracted invoice data against historical baselines to detect price hikes.

    **Authentication:** Include your API key in the `X-API-Key` header.

    **Input:** An `ExtractionResult` object (output of `/extract`).

    **Returns:** Price alert with flagged items, variance percentages, and margin impact.
    """
    start = time.time()
    tracker = UsageTracker()
    key_svc = APIKeyService()
    
    status_code = 200
    error_msg = None
    
    try:
        supabase = SupabaseService()
        gemini = GeminiService()
        
        user = supabase.get_user(api_key.user_id)
        threshold = getattr(user, "alert_threshold", 2.0)
        
        price_engine = PriceEngine(supabase, gemini=gemini, threshold_pct=threshold)
        alert = await price_engine.compare_prices(extraction, api_key.user_id)
        
        headers = _rate_limit_headers(api_key)
        for k, v in headers.items():
            response.headers[k] = v
            
        key_svc.increment_usage(api_key.id)
        return alert
        
    except HTTPException as e:
        status_code = e.status_code
        error_msg = e.detail
        raise
    except Exception as e:
        status_code = 500
        error_msg = f"Comparison failed: {str(e)}"
        logger.error("API v1 compare failed: %s", e)
        raise HTTPException(status_code=status_code, detail=error_msg)
    finally:
        latency = int((time.time() - start) * 1000)
        tracker.log_request(
            api_key_id=api_key.id,
            user_id=api_key.user_id,
            endpoint="/api/v1/compare",
            status_code=status_code,
            latency_ms=latency,
            error_message=error_msg
        )


@router.get("/health", summary="Public health check — no authentication required.")
async def api_health():
    """Public health check — no authentication required."""
    return {
        "status": "operational",
        "version": "1.1.0",
        "endpoints": [
            "/api/v1/extract",
            "/api/v1/compare"
        ]
    }
