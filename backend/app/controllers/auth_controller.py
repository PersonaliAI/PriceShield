from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from app.services.notification_service import NotificationService
from app.services.supabase_service import SupabaseService
import logging

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)
notifier = NotificationService()

class AuthActionRequest(BaseModel):
    email: EmailStr

@router.post("/reset-password")
async def request_password_reset(req: AuthActionRequest, background_tasks: BackgroundTasks):
    """Generate a Supabase password reset link and send it via a branded email."""
    try:
        sb = SupabaseService()
        res = sb.client.auth.admin.generate_link(
            type="recovery",
            email=req.email
        )
        # Handle response format from supabase admin auth
        link = getattr(res, "properties", {}).action_link if hasattr(res, "properties") else res.get("properties", {}).get("action_link")
        if not link:
            # check alternate return shape
            if hasattr(res, "action_link"):
                link = res.action_link
            else:
                link = res.dict().get("properties", {}).get("action_link") if hasattr(res, "dict") else None

        user_name = None
        try:
            user_res = sb.client.table("profiles").select("display_name").eq("email", req.email).limit(1).execute()
            if user_res.data:
                user_name = user_res.data[0].get("display_name")
        except:
            pass

        background_tasks.add_task(
            notifier.send_auth_email,
            to_email=req.email,
            link=link,
            type="reset",
            user_name=user_name
        )
        
        return {"message": "Password reset link generated and sent."}
    except Exception as e:
        logger.error(f"Failed to generate reset link for {req.email}: {e}")
        return {"message": "If an account exists, a reset link has been sent."}

@router.post("/verify-email")
async def request_email_verification(req: AuthActionRequest, background_tasks: BackgroundTasks):
    """Generate a Supabase email verification link and send it via a branded email."""
    try:
        sb = SupabaseService()
        res = sb.client.auth.admin.generate_link(
            type="signup",
            email=req.email
        )
        link = getattr(res, "properties", {}).action_link if hasattr(res, "properties") else res.get("properties", {}).get("action_link")
        if not link:
            # check alternate return shape
            if hasattr(res, "action_link"):
                link = res.action_link
            else:
                link = res.dict().get("properties", {}).get("action_link") if hasattr(res, "dict") else None
        
        user_name = None
        try:
            user_res = sb.client.table("profiles").select("display_name").eq("email", req.email).limit(1).execute()
            if user_res.data:
                user_name = user_res.data[0].get("display_name")
        except:
            pass

        background_tasks.add_task(
            notifier.send_auth_email,
            to_email=req.email,
            link=link,
            type="verify",
            user_name=user_name
        )
        
        return {"message": "Verification link generated and sent."}
    except Exception as e:
        logger.error(f"Failed to generate verification link for {req.email}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
