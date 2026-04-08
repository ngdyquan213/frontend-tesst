from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.enums import BookingStatus, PaymentStatus, RefundStatus


class BookingCreateRequest(BaseModel):
    flight_id: str
    quantity: int = Field(ge=1, le=10)


class HotelBookingCreateRequest(BaseModel):
    hotel_room_id: str
    check_in_date: date
    check_out_date: date
    quantity: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out_date <= self.check_in_date:
            raise ValueError("check_out_date must be after check_in_date")
        return self


class TourBookingCreateRequest(BaseModel):
    tour_schedule_id: str
    adult_count: int = Field(default=1, ge=0, le=20)
    child_count: int = Field(default=0, ge=0, le=20)
    infant_count: int = Field(default=0, ge=0, le=20)

    @model_validator(mode="after")
    def validate_counts(self):
        total = self.adult_count + self.child_count + self.infant_count
        if total <= 0:
            raise ValueError("At least one traveler is required")
        return self


class BookingCancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class BookingCancelResponse(BaseModel):
    booking_id: str
    booking_code: str
    status: BookingStatus
    payment_status: PaymentStatus
    refund_amount: Decimal
    refund_currency: str
    refund_status: RefundStatus | None = None
    cancellation_reason: str | None = None


class BookingResponse(BaseModel):
    id: str
    booking_code: str
    user_id: str
    status: BookingStatus
    total_base_amount: Decimal
    total_discount_amount: Decimal
    total_final_amount: Decimal
    currency: str
    payment_status: PaymentStatus
    booked_at: datetime
