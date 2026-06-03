from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field

class LineItem(BaseModel):
    item_name: str = Field(..., description="Name of the product/item")
    sku: Optional[str] = Field(None, description="SKU or product code if available")
    quantity: float = Field(..., description="Quantity ordered")
    unit_of_measure: Optional[str] = Field(None, description="Unit of measure (e.g., lbs, kg, case)")
    unit_price: float = Field(..., description="Price per unit")
    total_price: Optional[float] = Field(None, description="Line total (quantity × unit_price)")
    confidence: float = Field(1.0, description="AI confidence score for this item (0.0 - 1.0)")

class ExtractionResult(BaseModel):
    invoice_date: date = Field(..., description="Date printed on the invoice")
    due_date: Optional[date] = Field(None, description="Payment due date")
    invoice_number: Optional[str] = Field(None, description="Invoice # or Reference #")
    vendor_name: str = Field(..., description="Supplier / vendor name")
    vendor_address: Optional[str] = None
    vendor_tax_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    items: list[LineItem] = Field(..., description="Extracted line items")
    subtotal: Optional[float] = None
    tax_total: Optional[float] = None
    grand_total: Optional[float] = None
    currency: str = Field("USD", description="Currency code (e.g. LKR, USD)")
    notes: Optional[str] = None
    overall_confidence: float = Field(..., description="AI confidence score for entire extraction (0.0 - 1.0)")

class Invoice(BaseModel):
    id: Optional[str] = Field(None, description="Firestore document ID")
    user_id: str = Field(..., description="Owner's Firebase Auth UID")
    invoice_number: Optional[str] = None
    vendor_name: str
    vendor_address: Optional[str] = None
    vendor_tax_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    items: list[LineItem] = Field(default_factory=list)
    subtotal: Optional[float] = None
    tax_total: Optional[float] = None
    grand_total: Optional[float] = None
    currency: str = "LKR"
    notes: Optional[str] = None
    location_id: Optional[str] = Field(None, description="ID of the linked Location")
    raw_pdf_url: Optional[str] = Field(None, description="Cloud Storage URL of original PDF")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_baseline: bool = Field(False, description="Part of onboarding historical set")

    class Config:
        json_encoders = {
            date: lambda v: v.isoformat(),
            datetime: lambda v: v.isoformat()
        }

class PriceFlag(BaseModel):
    item_name: str
    sku: Optional[str] = None
    old_price: float
    new_price: float
    old_uom: Optional[str] = None
    new_uom: Optional[str] = None
    variance_pct: float = Field(..., description="Percentage change (e.g. 5.2 = +5.2%)")
    quantity: float = Field(0.0)
    margin_lost: float = Field(..., description="(new_price - old_price) × quantity")

class PriceAlert(BaseModel):
    vendor_name: str
    invoice_date: date
    flagged_items: list[PriceFlag] = Field(default_factory=list)
    total_margin_lost: float = Field(0.0)
    biggest_jump_item: Optional[str] = None
    biggest_jump_pct: Optional[float] = None
    has_hikes: bool = Field(False)
    is_duplicate: bool = Field(False)
