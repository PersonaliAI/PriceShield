from __future__ import annotations
import time
import logging
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, Depends
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

from app.models.api_models import APIKey, APIKeyTier, API_TIER_LIMITS
from app.middleware.api_key import get_api_key

logger = logging.getLogger(__name__)

class SlidingWindowRateLimiter:
    """
    In-memory sliding window counter.
    Each API key gets a window of 60 seconds.
    Thread-safe via Lock.
    """
    def __init__(self):
        self._windows = defaultdict(list)
        self._lock = Lock()

    def _cleanup(self, key_id: str, window_seconds: float = 60.0) -> None:
        """Remove timestamps older than the window."""
        now = time.time()
        cutoff = now - window_seconds
        self._windows[key_id] = [ts for ts in self._windows[key_id] if ts > cutoff]

    def check(self, key_id: str, tier: APIKeyTier) -> tuple[bool, int, int, int]:
        """
        Check rate limit and record the request.
        Returns: (allowed, limit, remaining, reset_seconds)
        """
        with self._lock:
            self._cleanup(key_id)
            limits = API_TIER_LIMITS.get(tier, API_TIER_LIMITS[APIKeyTier.FREE])
            max_per_min = limits.get("rate_limit_per_min", 10)
            current_count = len(self._windows[key_id])

            if current_count >= max_per_min:
                oldest = self._windows[key_id][0] if self._windows[key_id] else time.time() - 60.0
                reset_seconds = max(1, int(60.0 - (time.time() - oldest)))
                return False, max_per_min, 0, reset_seconds

            self._windows[key_id].append(time.time())
            remaining = max_per_min - (current_count + 1)
            return True, max_per_min, remaining, 0

_rate_limiter = SlidingWindowRateLimiter()

def get_rate_limiter() -> SlidingWindowRateLimiter:
    return _rate_limiter

async def check_rate_limit(api_key: APIKey = Depends(get_api_key)) -> APIKey:
    """
    FastAPI dependency that enforces per-key rate limits.
    Chain after get_api_key so the key is already validated.
    Returns the APIKey if allowed, raises 429 if not.
    """
    limiter = get_rate_limiter()
    allowed, limit, remaining, reset = limiter.check(api_key.id, api_key.tier)

    if not allowed:
        headers = {
            "Retry-After": str(reset),
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(reset)
        }
        raise HTTPException(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "rate_limit_exceeded",
                "message": f"Rate limit of {limit} requests/min exceeded. Retry in {reset}s.",
                "upgrade_url": "https://trypriceshield.com/dashboard/api"
            },
            headers=headers
        )

    return api_key
