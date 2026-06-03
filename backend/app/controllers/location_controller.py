"""Location controller — CRUD for restaurant locations."""

from __future__ import annotations

import logging
import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import get_current_user_uid
from app.models.user import Location, SubscriptionTier
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/locations", tags=["Locations"])


class LocationCreate(BaseModel):
    name: str
    address: Optional[str] = None


@router.get("", response_model=List[Location])
async def get_locations(user_id: str = Depends(get_current_user_uid)):
    """Return all locations for the current user."""
    supabase = SupabaseService()
    res = supabase.client.table("locations").select("*").eq("user_id", user_id).execute()
    return [Location(id=r["id"], name=r["name"], address=r.get("address")) for r in res.data or []]


@router.post("", response_model=Location)
async def create_location(
    req: LocationCreate,
    user_id: str = Depends(get_current_user_uid)
):
    """Add a new restaurant location (enforcing tier limits)."""
    supabase = SupabaseService()
    user = supabase.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    limit = 1
    if user.tier == SubscriptionTier.PRO:
        limit = 1
    elif user.tier == SubscriptionTier.MULTI:
        limit = 5
    else: # FREE
        limit = 1

    if len(user.locations) >= limit:
        raise HTTPException(
            status_code=403, 
            detail=f"Location limit reached for your {user.tier.value if hasattr(user.tier, 'value') else user.tier} tier ({limit} max). Please upgrade to add more."
        )

    new_id = str(uuid.uuid4())[:8]
    new_loc = {
        "id": new_id,
        "user_id": user_id,
        "name": req.name,
        "address": req.address
    }
    supabase.client.table("locations").insert(new_loc).execute()
    
    return Location(id=new_id, name=req.name, address=req.address)


@router.delete("/{location_id}")
async def delete_location(
    location_id: str,
    user_id: str = Depends(get_current_user_uid)
):
    """Remove a location."""
    supabase = SupabaseService()
    
    res = supabase.client.table("locations").select("*").eq("user_id", user_id).execute()
    if len(res.data or []) <= 1:
        raise HTTPException(status_code=400, detail="You must have at least one location.")

    target = [r for r in res.data if r["id"] == location_id]
    if not target:
        raise HTTPException(status_code=404, detail="Location not found")

    supabase.client.table("locations").delete().eq("id", location_id).eq("user_id", user_id).execute()
    return {"status": "deleted"}


@router.put("/{location_id}", response_model=Location)
async def update_location(
    location_id: str,
    req: LocationCreate,
    user_id: str = Depends(get_current_user_uid)
):
    """Update an existing location's name and address."""
    supabase = SupabaseService()
    
    res = supabase.client.table("locations").update({
        "name": req.name,
        "address": req.address
    }).eq("id", location_id).eq("user_id", user_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Location not found")

    row = res.data[0]
    return Location(id=row["id"], name=row["name"], address=row.get("address"))
