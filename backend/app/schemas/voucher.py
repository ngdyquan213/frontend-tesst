from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import (
    BookingItemType,
    BookingStatus,
    DocumentType,
    PaymentStatus,
    TravelerType,
)


class VoucherTravelerResponse(BaseModel):
    full_name: str
    traveler_type: TravelerType
    passport_number: str | None = None
    nationality: str | None = None
    document_type: DocumentType | None = None


class VoucherItemResponse(BaseModel):
    item_type: BookingItemType
    reference_id: str | None = None
    title: str
    description: str | None = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    check_in_date: date | None = None
    check_out_date: date | None = None


class BookingVoucherResponse(BaseModel):
    booking_id: str
    booking_code: str
    booking_status: BookingStatus
    payment_status: PaymentStatus
    booked_at: datetime
    customer_name: str
    customer_email: str
    currency: str
    total_base_amount: Decimal
    total_discount_amount: Decimal
    total_final_amount: Decimal
    voucher_type: str
    items: list[VoucherItemResponse]
    travelers: list[VoucherTravelerResponse]
    notes: str | None = None
