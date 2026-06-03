"""Usage tracking service — logs every API request to the `api_usage` Postgres table."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Optional

from app.models.api_models import UsageRecord, UsageSummary
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class UsageTracker:
    """Logs and aggregates API usage data."""

    def __init__(self, supabase: Optional[SupabaseService] = None) -> None:
        self.sb = supabase or SupabaseService()

    @property
    def _table(self):
        return self.sb.client.table("api_usage")

    def log_request(
        self,
        api_key_id: str,
        user_id: str,
        endpoint: str,
        status_code: int,
        latency_ms: int,
        file_size_bytes: int = 0,
        items_extracted: int = 0,
        error_message: Optional[str] = None
    ) -> None:
        """Fire-and-forget write of a usage record."""
        try:
            self._table.insert({
                "api_key_id": api_key_id,
                "user_id": user_id,
                "endpoint": endpoint,
                "status_code": status_code,
                "latency_ms": latency_ms,
                "file_size_bytes": file_size_bytes,
                "items_extracted": items_extracted,
                "error_message": error_message
            }).execute()
        except Exception as e:
            logger.error("Failed to log API usage: %s", e)

    def get_monthly_count(self, api_key_id: str) -> int:
        try:
            month_start = datetime.utcnow().strftime('%Y-%m-%01T00:00:00')
            res = self._table.select("id", count="exact").eq("api_key_id", api_key_id).gte("timestamp", month_start).execute()
            return res.count if res.count is not None else 0
        except Exception as e:
            logger.error("Failed to get monthly count: %s", e)
            return 0

    def get_usage_summary(
        self,
        api_key_id: str,
        days: int = 30,
        key_name: str = "",
        tier: str = ""
    ) -> UsageSummary:
        try:
            cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
            period_end = datetime.utcnow().isoformat()
            
            res = self._table.select("*").eq("api_key_id", api_key_id).gte("timestamp", cutoff).execute()
            rows = res.data or []
            
            records = [UsageRecord(**r) for r in rows]
            total = len(records)
            
            successful = sum(1 for r in records if 200 <= r.status_code < 300)
            failed = total - successful
            
            extractions = sum(1 for r in records if r.endpoint == "extract")
            comparisons = sum(1 for r in records if r.endpoint == "compare")
            
            avg_latency = round(sum(r.latency_ms for r in records) / total, 2) if total > 0 else 0.0
            total_bytes = sum(r.file_size_bytes for r in records)
            
            return UsageSummary(
                api_key_id=api_key_id,
                key_name=key_name,
                tier=tier,
                period_start=cutoff,
                period_end=period_end,
                total_requests=total,
                successful_requests=successful,
                failed_requests=failed,
                total_extractions=extractions,
                total_comparisons=comparisons,
                avg_latency_ms=avg_latency,
                total_bytes_processed=total_bytes,
                quota_used_pct=0.0 # set by caller based on tier limit
            )
        except Exception as e:
            logger.error("Failed to get usage summary for %s: %s", api_key_id, e)
            # Return empty summary
            cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
            period_end = datetime.utcnow().isoformat()
            return UsageSummary(
                api_key_id=api_key_id,
                period_start=cutoff,
                period_end=period_end
            )

    def get_recent_logs(self, api_key_id: str, limit: int = 50) -> list[UsageRecord]:
        try:
            res = self._table.select("*").eq("api_key_id", api_key_id).order("timestamp", desc=True).limit(limit).execute()
            return [UsageRecord(**r) for r in res.data or []]
        except Exception as e:
            logger.error("get_recent_logs failed: %s", e)
            return []
