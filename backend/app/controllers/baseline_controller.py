"""Baseline controller — API endpoints for managing supplier price baselines."""

from __future__ import annotations

import logging
from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import get_current_user_uid
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/baselines", tags=["Baselines"])


class BaselineItemUpdate(BaseModel):
    sku: Optional[str] = None
    unit_price: float
    unit_of_measure: Optional[str] = None


@router.get("", summary="Get all vendor baselines")
def get_all_baselines(user_id: str = Depends(get_current_user_uid)):
    """Fetch all stored price baselines for all vendors."""
    supabase = SupabaseService()
    try:
        return supabase.get_all_baselines(user_id)
    except Exception as e:
        logger.error(f"Failed to fetch baselines: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch baselines")


@router.put("/{vendor_name}/{item_name}", summary="Update a baseline item")
def update_baseline_item(
    vendor_name: str,
    item_name: str,
    update: BaselineItemUpdate,
    user_id: str = Depends(get_current_user_uid)
):
    """Update price or SKU for a specific item in a vendor's baseline."""
    supabase = SupabaseService()
    try:
        item_data = {
            "sku": update.sku,
            "unit_price": update.unit_price,
            "unit_of_measure": update.unit_of_measure,
            "updated_at": datetime.utcnow().isoformat()
        }
        supabase.update_baseline_item(user_id, vendor_name, item_name, item_data)
        return {"status": "success", "message": f"Updated {item_name} for {vendor_name}"}
    except Exception as e:
        logger.error(f"Failed to update baseline item: {e}")
        raise HTTPException(status_code=500, detail="Failed to update baseline item")


@router.delete("/{vendor_name}/{item_name}", summary="Delete a baseline item")
def delete_baseline_item(
    vendor_name: str,
    item_name: str,
    user_id: str = Depends(get_current_user_uid)
):
    """Remove an item from a vendor's price baseline."""
    supabase = SupabaseService()
    try:
        supabase.delete_baseline_item(user_id, vendor_name, item_name)
        return {"status": "success", "message": f"Deleted {item_name} from {vendor_name}"}
    except Exception as e:
        logger.error(f"Failed to delete baseline item: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete baseline item")


@router.delete("/{vendor_name}", summary="Delete a vendor baseline")
def delete_vendor_baseline(
    vendor_name: str,
    user_id: str = Depends(get_current_user_uid)
):
    """Completely remove all baseline data for a specific vendor."""
    supabase = SupabaseService()
    try:
        supabase.delete_vendor_baseline(user_id, vendor_name)
        return {"status": "success", "message": f"Deleted baseline for {vendor_name}"}
    except Exception as e:
        logger.error(f"Failed to delete vendor baseline: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete vendor baseline")
