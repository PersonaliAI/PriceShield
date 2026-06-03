"""Onboarding controller — cold-start historical audit with 3 invoices."""

from __future__ import annotations

import logging
import asyncio
from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks

from app.middleware.auth import get_current_user_uid
from app.models.alert import Alert, AlertType
from app.models.invoice import Invoice
from app.models.user import User
from app.services.supabase_service import SupabaseService
from app.services.gemini_service import GeminiService
from app.services.notification_service import NotificationService
from app.services.price_engine import PriceEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/create-job", summary="Create a job before uploading files")
def create_job(user_id: str = Depends(get_current_user_uid)):
    """Lightweight endpoint: creates the Supabase job doc and returns immediately."""
    job_id = str(uuid.uuid4())
    supabase = SupabaseService()
    supabase.set_audit_job_status(user_id, job_id, {"status": "uploading", "progress": 0})
    supabase.save_audit_log(user_id, job_id, "Initializing PriceShield AI Agent...")
    supabase.save_audit_log(user_id, job_id, "Waiting for invoice upload to complete...")
    return {"job_id": job_id}


@router.post("/audit", summary="Run cold-start historical audit")
def run_historical_audit(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(..., description="3 historical invoice PDFs"),
    location_id: Optional[str] = None,
    job_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_uid),
):
    if not job_id:
        job_id = str(uuid.uuid4())
    supabase = SupabaseService()
    
    supabase.save_audit_log(user_id, job_id, f"Upload complete. Received {len(files)} invoices.")
    
    files_data = []
    for f in files:
        data = f.file.read()
        files_data.append({"filename": f.filename, "content": data})

    supabase.set_audit_job_status(user_id, job_id, {"status": "processing", "progress": 0})
    supabase.save_audit_log(user_id, job_id, "Starting AI extraction engine...")
    
    background_tasks.add_task(
        process_audit_background, 
        user_id, 
        job_id, 
        files_data, 
        location_id
    )
    
    return {"job_id": job_id}


@router.get("/job/{job_id}/status")
def get_job_status(job_id: str, user_id: str = Depends(get_current_user_uid)):
    supabase = SupabaseService()
    return supabase.get_audit_job_status(user_id, job_id)


@router.get("/job/{job_id}/logs")
def get_job_logs(job_id: str, user_id: str = Depends(get_current_user_uid)):
    supabase = SupabaseService()
    try:
        logs = supabase.get_audit_logs(user_id, job_id)
        logger.info("Returned %d logs for job %s (user %s)", len(logs), job_id, user_id)
        return logs
    except Exception as e:
        logger.exception(f"Failed to get logs for job {job_id}")
        return []


@router.get("/debug-logs/{uid}/{job_id}")
async def debug_logs(uid: str, job_id: str):
    """Temporary debug endpoint — no auth required."""
    supabase = SupabaseService()
    try:
        logs = supabase.get_audit_logs(uid, job_id)
        return {"count": len(logs), "logs": logs}
    except Exception as e:
        logger.exception("Debug logs error")
        return {"error": str(e)}


async def process_audit_background(user_id: str, job_id: str, files_data: list[dict], location_id: Optional[str]):
    supabase = SupabaseService()
    gemini = GeminiService()
    
    try:
        supabase.save_audit_log(user_id, job_id, "Initializing PriceShield AI Agent...")
        supabase.save_audit_log(user_id, job_id, "Connecting to PriceShield AI (Flash Engine)...")
        
        user = supabase.get_user(user_id)
        threshold = getattr(user, "alert_threshold", 2.0)
        price_engine = PriceEngine(supabase, gemini=gemini, threshold_pct=threshold)
        
        from app.models.user import SubscriptionTier
        from app.controllers.ingestion_controller import find_best_location_match

        extractions = []
        supabase.save_audit_log(user_id, job_id, f"Detected {len(files_data)} documents in queue. Starting parallel extraction...")
        
        tasks = [gemini.extract_invoice(f['content']) for f in files_data]
        supabase.set_audit_job_status(user_id, job_id, {"status": "processing", "progress": 20})
        
        extractions = await asyncio.gather(*tasks)
        supabase.save_audit_log(user_id, job_id, f"Successfully extracted {len(extractions)} invoices.")

        is_multi = user and user.tier == SubscriptionTier.MULTI

        for ext in extractions:
            matched_id = find_best_location_match(user, ext.customer_address) if user else None
            if ext.customer_address and matched_id is None and not is_multi:
                err_msg = f"Notice: Deliveries to {ext.customer_address} were analyzed, but this location is not yet registered in your settings."
                supabase.save_audit_log(user_id, job_id, f"⚠️ {err_msg}")

        supabase.set_audit_job_status(user_id, job_id, {"status": "processing", "progress": 70})
        supabase.save_audit_log(user_id, job_id, f"Running historical comparison for {len(extractions)} invoices...")
        
        alerts = await price_engine.run_historical_audit(extractions, user_id)
        
        supabase.set_audit_job_status(user_id, job_id, {"status": "processing", "progress": 90})
        
        total_loss = sum(a.total_margin_lost for a in alerts)
        total_hikes = sum(len(a.flagged_items) for a in alerts)
        supabase.save_audit_log(user_id, job_id, f"Comparison done: Found {total_hikes} stealth hikes.")

        supabase.save_audit_log(user_id, job_id, "Finalizing job results...")
        for ext in extractions:
            invoice = Invoice(
                user_id=user_id,
                vendor_name=ext.vendor_name,
                invoice_date=ext.invoice_date,
                items=ext.items,
                location_id=location_id,
                is_baseline=True,
            )
            supabase.save_invoice(invoice)

        all_flagged = []
        for a in alerts:
            all_flagged.extend(a.flagged_items)
        
        alert = Alert(
            user_id=user_id,
            alert_type=AlertType.HISTORICAL_AUDIT,
            vendor_name=extractions[0].vendor_name if extractions else "Multiple Vendors",
            message=NotificationService.format_historical_audit(alerts),
            total_margin_lost=total_loss,
            flagged_items=all_flagged,
            has_hikes=total_loss > 0,
        )
        supabase.save_alert(alert)

        supabase.update_user(user_id, {
            "onboarding_complete": True, 
            "invoices_uploaded": getattr(user, "invoices_uploaded", 0) + len(files_data),
            "manual_uploads_count": getattr(user, "manual_uploads_count", 0) + len(files_data)
        })

        result = {
            "status": "completed",
            "progress": 100,
            "invoices_processed": len(extractions),
            "total_historical_loss": round(total_loss, 2),
            "total_hikes_found": total_hikes,
            "comparisons": [a.model_dump(mode="json") for a in alerts],
            "completed_at": datetime.utcnow().isoformat()
        }
        
        notifier = NotificationService()
        if user:
            supabase.set_audit_job_status(user_id, job_id, result)
            
            await notifier.dispatch_alert(
                alert,
                telegram_chat_id=user.telegram_chat_id,
                whatsapp_number=user.whatsapp_number,
                onesignal_player_id=getattr(user, "onesignal_player_id", None),
                user_uid=user_id,
                user_email=user.email,
                alert_email=getattr(user, "alert_email", None),
                slack_webhook_url=getattr(user, "slack_webhook_url", None),
                slack_channel_id=getattr(user, "slack_user_id", None),
                alert_channels=["email", "push", "slack"]
            )

        supabase.save_audit_log(user_id, job_id, "Saving results to your dashboard...")
        supabase.save_audit_log(user_id, job_id, "SUCCESS: Historical audit complete!")

    except Exception as e:
        logger.exception("Background audit failed")
        supabase.save_audit_log(user_id, job_id, f"Notice: {str(e)}")
        supabase.set_audit_job_status(user_id, job_id, {"status": "failed", "error": str(e)})
