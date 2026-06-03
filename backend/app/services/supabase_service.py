from __future__ import annotations
import uuid
import logging
from datetime import datetime, date, timezone
from typing import Any, Optional
from supabase import create_client, Client
from pydantic import BaseModel

from app.config import get_settings
from app.models.user import User, Location, SubscriptionTier
from app.models.invoice import Invoice, LineItem
from app.models.alert import Alert, AlertType
from app.models.inbox import InboxMessage, AttachmentMetadata
from app.models.chat import ChatMessage, ChatRole

logger = logging.getLogger(__name__)

def _parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            # Handle Zulu time format replacement
            s = value.replace("Z", "+00:00")
            return datetime.fromisoformat(s)
        except ValueError:
            return None
    return None

def _is_uuid(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False

class SupabaseService:
    def __init__(self) -> None:
        cfg = get_settings()
        if not cfg.supabase_url or not cfg.supabase_service_role_key:
            raise RuntimeError("Supabase config missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        self.client: Client = create_client(cfg.supabase_url, cfg.supabase_service_role_key)
        self.invoices_bucket = cfg.supabase_invoices_bucket
        self.attachments_bucket = cfg.supabase_attachments_bucket
        logger.info("SupabaseService initialised — connected to %s", cfg.supabase_url)

    def _bucket_for(self, path: str) -> str:
        if path.startswith("invoices") or "invoice" in path.lower():
            return self.invoices_bucket
        return self.attachments_bucket

    def _profile_row_to_user(self, row: dict, locations: Optional[list[dict]] = None, api_keys: Optional[list[str]] = None) -> User:
        locs = []
        if locations:
            for l in locations:
                locs.append(Location(
                    id=l.get("id"),
                    name=l.get("name"),
                    address=l.get("address"),
                    created_at=_parse_dt(l.get("created_at")) or datetime.utcnow()
                ))
        if not locs:
            locs = [Location(id="main", name="Main Location")]

        return User(
            uid=row.get("id"),
            email=row.get("email"),
            display_name=row.get("display_name"),
            tier=SubscriptionTier(row.get("tier", "free")),
            api_keys=api_keys or row.get("api_keys") or [],
            telegram_chat_id=row.get("telegram_chat_id"),
            whatsapp_number=row.get("whatsapp_number"),
            forwarding_emails=row.get("forwarding_emails") or [],
            alert_email=row.get("alert_email"),
            onesignal_player_id=row.get("onesignal_player_id"),
            alert_channels=row.get("alert_channels") or ["email", "push"],
            report_daily=row.get("report_daily", True),
            report_weekly=row.get("report_weekly", True),
            report_monthly=row.get("report_monthly", True),
            onboarding_complete=row.get("onboarding_complete", False),
            invoices_uploaded=row.get("invoices_uploaded", 0),
            manual_uploads_count=row.get("manual_uploads_count", 0),
            alert_threshold=row.get("alert_threshold", 2.0),
            slack_webhook_url=row.get("slack_webhook_url"),
            slack_user_id=row.get("slack_user_id"),
            slack_team_id=row.get("slack_team_id"),
            locations=locs,
            ls_customer_id=row.get("ls_customer_id"),
            ls_subscription_id=row.get("ls_subscription_id"),
            ls_subscription_status=row.get("ls_subscription_status"),
            created_at=_parse_dt(row.get("created_at")) or datetime.utcnow(),
            country=row.get("country"),
            timezone=row.get("timezone")
        )

    def _user_to_profile_row(self, user: User) -> dict:
        return {
            "id": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "tier": user.tier,
            "api_keys": user.api_keys,
            "telegram_chat_id": user.telegram_chat_id,
            "whatsapp_number": user.whatsapp_number,
            "forwarding_emails": user.forwarding_emails,
            "alert_email": user.alert_email,
            "onesignal_player_id": user.onesignal_player_id,
            "alert_channels": user.alert_channels,
            "report_daily": user.report_daily,
            "report_weekly": user.report_weekly,
            "report_monthly": user.report_monthly,
            "onboarding_complete": user.onboarding_complete,
            "invoices_uploaded": user.invoices_uploaded,
            "manual_uploads_count": user.manual_uploads_count,
            "alert_threshold": user.alert_threshold,
            "slack_webhook_url": user.slack_webhook_url,
            "slack_user_id": user.slack_user_id,
            "slack_team_id": user.slack_team_id,
            "ls_customer_id": user.ls_customer_id,
            "ls_subscription_id": user.ls_subscription_id,
            "ls_subscription_status": user.ls_subscription_status,
            "country": user.country,
            "timezone": user.timezone
        }

    def get_user(self, uid: str) -> Optional[User]:
        res = self.client.table("profiles").select("*").eq("id", uid).maybe_single().execute()
        if not res or not res.data:
            return None
        locs_res = self.client.table("locations").select("*").eq("user_id", uid).execute()
        # Fetch key list
        keys_res = self.client.table("api_keys").select("id").eq("user_id", uid).eq("is_active", True).execute()
        api_keys = [k.get("id") for k in keys_res.data] if keys_res.data else []
        return self._profile_row_to_user(res.data, locs_res.data, api_keys)

    def get_or_create_user(self, uid: str, email: str) -> User:
        user = self.get_user(uid)
        if user:
            return user
        payload = {
            "id": uid,
            "email": email,
            "onboarding_complete": False
        }
        self.client.table("profiles").insert(payload).execute()
        return self.get_user(uid)

    def save_user(self, user: User) -> None:
        row = self._user_to_profile_row(user)
        self.client.table("profiles").upsert(row).execute()
        # Save locations sibling
        for loc in user.locations:
            loc_row = {
                "id": loc.id,
                "user_id": user.uid,
                "name": loc.name,
                "address": loc.address
            }
            self.client.table("locations").upsert(loc_row, on_conflict="id").execute()

    def update_user(self, uid: str, data: dict[str, Any]) -> None:
        payload = {}
        for k, v in data.items():
            if isinstance(v, datetime) or isinstance(v, date):
                payload[k] = v.isoformat()
            else:
                payload[k] = v
        self.client.table("profiles").update(payload).eq("id", uid).execute()

    def get_user_by_slack_id(self, slack_user_id: str) -> Optional[User]:
        res = self.client.table("profiles").select("*").eq("slack_user_id", slack_user_id).limit(1).execute()
        if not res.data:
            return None
        uid = res.data[0].get("id")
        return self.get_user(uid)

    def get_user_uid_by_slack_id(self, slack_user_id: str) -> Optional[str]:
        res = self.client.table("profiles").select("id").eq("slack_user_id", slack_user_id).limit(1).execute()
        if res.data:
            return res.data[0].get("id")
        return None

    def get_user_uid_by_telegram_id(self, telegram_id: str) -> Optional[str]:
        res = self.client.table("profiles").select("id").eq("telegram_chat_id", str(telegram_id)).limit(1).execute()
        if res.data:
            return res.data[0].get("id")
        return None

    def find_user_uid_by_email(self, email: str) -> Optional[str]:
        res = self.client.table("profiles").select("id").eq("email", email).limit(1).execute()
        if res.data:
            return res.data[0].get("id")
        return None

    def find_user_uid_by_forwarding_email(self, email: str) -> Optional[str]:
        res = self.client.table("profiles").select("id").contains("forwarding_emails", [email]).limit(1).execute()
        if res.data:
            return res.data[0].get("id")
        return self.find_user_uid_by_email(email)

    def clear_user_field(self, uid: str, field: str) -> None:
        payload = {field: None}
        self.client.table("profiles").update(payload).eq("id", uid).execute()

    def get_all_users(self) -> list[User]:
        res = self.client.table("profiles").select("*").execute()
        users = []
        for r in res.data:
            uid = r.get("id")
            locs_res = self.client.table("locations").select("*").eq("user_id", uid).execute()
            users.append(self._profile_row_to_user(r, locs_res.data))
        return users

    def save_invoice(self, invoice: Invoice) -> str:
        row = invoice.model_dump(exclude={"items"}, mode="json")
        row["id"] = invoice.id or str(uuid.uuid4())
        self.client.table("invoices").insert(row).execute()
        
        # Save items payload
        for idx, item in enumerate(invoice.items):
            item_row = {
                "invoice_id": row["id"],
                "item_name": item.item_name,
                "sku": item.sku,
                "quantity": item.quantity,
                "unit_of_measure": item.unit_of_measure,
                "unit_price": item.unit_price,
                "total_price": item.total_price or (item.unit_price * item.quantity),
                "confidence": item.confidence,
                "position": idx
            }
            self.client.table("line_items").insert(item_row).execute()
        logger.info("Saved invoice %s for user %s", row["id"], invoice.user_id)
        return row["id"]

    def is_duplicate_invoice(self, user_id: str, vendor_name: str, invoice_number: Optional[str], invoice_date: Optional[date]) -> bool:
        if not invoice_number or invoice_number.strip().lower() in ("", "n/a", "none", "null"):
            return False
        q = self.client.table("invoices").select("id, created_at").eq("user_id", user_id).eq("vendor_name", vendor_name).eq("invoice_number", invoice_number)
        if invoice_date:
            q = q.eq("invoice_date", invoice_date.isoformat())
        res = q.limit(1).execute()
        if res.data:
            created_at = _parse_dt(res.data[0].get("created_at"))
            if created_at:
                delta = (datetime.now(timezone.utc) - created_at).total_seconds()
                if delta < 86400:
                    logger.info("Recent duplicate found (%s) — allowing as retry.", res.data[0].get("id"))
                    return False
            return True
        return False

    def get_previous_invoice_for_vendor(self, user_id: str, vendor_name: str, before_date: str) -> Optional[Invoice]:
        res = self.client.table("invoices").select("*").eq("user_id", user_id).eq("vendor_name", vendor_name).lt("invoice_date", before_date).order("invoice_date", desc=True).limit(1).execute()
        if res.data:
            return self._hydrate_invoice(res.data[0])
        return None

    def get_latest_invoice_for_vendor(self, user_id: str, vendor_name: str) -> Optional[Invoice]:
        res = self.client.table("invoices").select("*").eq("user_id", user_id).eq("vendor_name", vendor_name).order("invoice_date", desc=True).limit(1).execute()
        if res.data:
            return self._hydrate_invoice(res.data[0])
        return None

    def get_invoices_for_vendor(self, user_id: str, vendor_name: str, limit: int = 20, offset: int = 0) -> list[Invoice]:
        res = self.client.table("invoices").select("*").eq("user_id", user_id).eq("vendor_name", vendor_name).order("invoice_date", desc=True).range(offset, offset + limit - 1).execute()
        return [self._hydrate_invoice(r) for r in res.data]

    def get_invoices_last_n_days(self, user_id: str, days: int) -> list[Invoice]:
        from datetime import timedelta
        cutoff = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
        res = self.client.table("invoices").select("*").eq("user_id", user_id).gte("invoice_date", cutoff).order("invoice_date", desc=True).execute()
        return [self._hydrate_invoice(r) for r in res.data]

    def get_all_invoices(self, user_id: str, limit: int = 30, offset: int = 0) -> list[Invoice]:
        res = self.client.table("invoices").select("*").eq("user_id", user_id).order("invoice_date", desc=True).range(offset, offset + limit - 1).execute()
        return [self._hydrate_invoice(r) for r in res.data]

    def _hydrate_invoice(self, row: dict) -> Invoice:
        inv_id = row.get("id")
        items_res = self.client.table("line_items").select("*").eq("invoice_id", inv_id).order("position").execute()
        items = []
        for i in items_res.data:
            items.append(LineItem(
                item_name=i.get("item_name"),
                sku=i.get("sku"),
                quantity=float(i.get("quantity") or 0),
                unit_of_measure=i.get("unit_of_measure"),
                unit_price=float(i.get("unit_price") or 0),
                total_price=float(i.get("total_price") or 0),
                confidence=float(i.get("confidence") or 1.0)
            ))
        row["items"] = items
        # Format date properties
        if isinstance(row.get("invoice_date"), str):
            row["invoice_date"] = date.fromisoformat(row["invoice_date"])
        if isinstance(row.get("due_date"), str):
            row["due_date"] = date.fromisoformat(row["due_date"])
        return Invoice(**row)

    def save_alert(self, alert: Alert) -> str:
        row = alert.model_dump(exclude={"id"}, mode="json")
        row["id"] = str(uuid.uuid4())
        self.client.table("alerts").insert(row).execute()
        return row["id"]

    def get_alerts(self, user_id: str, limit: int = 500) -> list[Alert]:
        res = self.client.table("alerts").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        alerts = []
        for r in res.data:
            r["id"] = str(r["id"])
            alerts.append(Alert(**r))
        return alerts

    def get_alerts_since(self, user_id: str, since_date: str) -> list[Alert]:
        res = self.client.table("alerts").select("*").eq("user_id", user_id).gte("created_at", since_date).order("created_at", desc=True).execute()
        alerts = []
        for r in res.data:
            r["id"] = str(r["id"])
            alerts.append(Alert(**r))
        return alerts

    def upload_file(self, content: bytes, destination_path: str, content_type: str = "application/octet-stream") -> str:
        bucket = self._bucket_for(destination_path)
        # Upload using upsert
        self.client.storage.from_(bucket).upload(
            path=destination_path,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        logger.info("Uploaded file to Supabase Storage: %s/%s", bucket, destination_path)
        return destination_path

    def get_signed_url(self, storage_path: str, expiration_minutes: int = 60) -> str:
        bucket = self._bucket_for(storage_path)
        res = self.client.storage.from_(bucket).create_signed_url(storage_path, expiration_minutes * 60)
        return res.get("signedURL") or ""

    def delete_file(self, path: str) -> str:
        bucket = self._bucket_for(path)
        self.client.storage.from_(bucket).remove([path])
        return path

    def save_inbox_message(self, message: InboxMessage) -> str:
        row = message.model_dump(exclude={"id"}, mode="json")
        row["id"] = str(uuid.uuid4())
        self.client.table("inbox_messages").insert(row).execute()
        return row["id"]

    def get_inbox_messages(self, user_id: str, limit: int = 50, offset: int = 0) -> list[InboxMessage]:
        res = self.client.table("inbox_messages").select("*").eq("user_id", user_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return [InboxMessage(**r) for r in res.data]

    def save_audit_log(self, user_id: str, job_id: str, message: str) -> None:
        self.client.table("audit_logs").insert({
            "job_id": job_id,
            "user_id": user_id,
            "message": message
        }).execute()

    def get_audit_logs(self, user_id: str, job_id: str) -> list[dict]:
        res = self.client.table("audit_logs").select("message, created_at").eq("job_id", job_id).eq("user_id", user_id).order("created_at").execute()
        return res.data

    def set_audit_job_status(self, user_id: str, job_id: str, status: dict) -> None:
        payload = {
            "id": job_id,
            "user_id": user_id,
            **status
        }
        if "completed_at" in payload and isinstance(payload["completed_at"], datetime):
            payload["completed_at"] = payload["completed_at"].isoformat()
        self.client.table("audit_jobs").upsert(payload).execute()

    def get_audit_job_status(self, user_id: str, job_id: str) -> dict:
        res = self.client.table("audit_jobs").select("*").eq("id", job_id).eq("user_id", user_id).maybe_single().execute()
        if not res or not res.data:
            return {}
        return res.data

    def save_baseline(self, user_id: str, vendor_name: str, items: list[LineItem], invoice_date: Optional[date]) -> None:
        """Upsert latest unit prices per (vendor, item) for variance checks."""
        # Get baseline for comparison of invoice dates if already existing
        res = self.client.table("baselines").select("last_invoice_date").eq("user_id", user_id).eq("vendor_name", vendor_name).order("last_invoice_date", desc=True).limit(1).execute()
        if res.data and invoice_date:
            last_date_str = res.data[0].get("last_invoice_date")
            if last_date_str:
                last_date = date.fromisoformat(last_date_str)
                if last_date > invoice_date:
                    logger.info("Skipping baseline update for %s: existing %s newer than %s", vendor_name, last_date, invoice_date)
                    return

        for item in items:
            payload = {
                "user_id": user_id,
                "vendor_name": vendor_name,
                "item_name": item.item_name,
                "sku": item.sku,
                "unit_price": item.unit_price,
                "unit_of_measure": item.unit_of_measure,
                "last_invoice_date": invoice_date.isoformat() if invoice_date else None
            }
            self.client.table("baselines").upsert(payload).execute()

    def get_baseline(self, user_id: str, vendor_name: str) -> dict[str, Any]:
        """Return baseline shaped like the legacy Firestore doc: {item_name: {sku, unit_price, ...}}."""
        res = self.client.table("baselines").select("*").eq("user_id", user_id).eq("vendor_name", vendor_name).execute()
        out = {}
        for r in res.data:
            out[r["item_name"]] = {
                "sku": r.get("sku"),
                "unit_price": float(r.get("unit_price") or 0.0),
                "unit_of_measure": r.get("unit_of_measure"),
                "last_invoice_date": r.get("last_invoice_date")
            }
        return out

    def get_all_baselines(self, user_id: str) -> dict[str, dict[str, Any]]:
        """Return {vendor_name: {item_name: {...}}}."""
        res = self.client.table("baselines").select("*").eq("user_id", user_id).execute()
        out = {}
        for r in res.data:
            v_name = r["vendor_name"]
            out.setdefault(v_name, {})[r["item_name"]] = {
                "sku": r.get("sku"),
                "unit_price": float(r.get("unit_price") or 0.0),
                "unit_of_measure": r.get("unit_of_measure"),
                "last_invoice_date": r.get("last_invoice_date")
            }
        return out

    def update_baseline_item(self, user_id: str, vendor_name: str, item_name: str, item_data: dict) -> None:
        payload = {
            "user_id": user_id,
            "vendor_name": vendor_name,
            "item_name": item_name
        }
        allowed_keys = {"unit_price", "unit_of_measure", "last_invoice_date", "sku"}
        for k, v in item_data.items():
            if k in allowed_keys:
                payload[k] = v
        self.client.table("baselines").upsert(payload).execute()

    def delete_baseline_item(self, user_id: str, vendor_name: str, item_name: str) -> None:
        self.client.table("baselines").delete().eq("user_id", user_id).eq("vendor_name", vendor_name).eq("item_name", item_name).execute()

    def delete_vendor_baseline(self, user_id: str, vendor_name: str) -> None:
        self.client.table("baselines").delete().eq("user_id", user_id).eq("vendor_name", vendor_name).execute()

    def save_chat_message(self, message: ChatMessage) -> str:
        row = message.model_dump(exclude={"id"}, mode="json")
        row["id"] = str(uuid.uuid4())
        self.client.table("chat_messages").insert(row).execute()
        return row["id"]

    def get_chat_history(self, user_id: str, limit: int = 10) -> list[ChatMessage]:
        res = self.client.table("chat_messages").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        history = [ChatMessage(**r) for r in reversed(res.data)]
        return history

    def get_dashboard_summary(self, user_id: str) -> dict[str, Any]:
        alerts = self.get_alerts(user_id, limit=500)
        
        # Calculate summary metrics
        total_saved = sum(float(a.total_margin_lost) for a in alerts if a.alert_type == AlertType.HISTORICAL_AUDIT)
        # Count flagged items across all alert types — HISTORICAL_AUDIT (onboarding batch) and
        # PRICE_HIKE (single invoice) both carry flagged_items.
        hikes_caught = sum(len(a.flagged_items) for a in alerts if a.alert_type != AlertType.ALL_CLEAR)
        
        vendor_losses = {}
        for a in alerts:
            vendor_losses[a.vendor_name] = vendor_losses.get(a.vendor_name, 0.0) + float(a.total_margin_lost)
            
        top_vendor = "N/A"
        if vendor_losses:
            top_vendor = max(vendor_losses, key=vendor_losses.get)
            
        # Count unique vendors tracked
        invoices_res = self.client.table("invoices").select("vendor_name").eq("user_id", user_id).execute()
        vendors_tracked = len(set(r.get("vendor_name") for r in invoices_res.data)) if invoices_res.data else 0
        
        return {
            "total_margin_lost": round(total_saved, 2),
            "hikes_caught": hikes_caught,
            "top_offending_vendor": top_vendor,
            "vendors_tracked": vendors_tracked
        }
