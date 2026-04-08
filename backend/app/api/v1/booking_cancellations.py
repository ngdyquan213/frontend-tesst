from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import build_booking_cancellation_service, get_current_user
from app.core.database import get_db
from app.schemas.booking import BookingCancelRequest, BookingCancelResponse
from app.utils.enums import enum_to_str
from app.utils.request_context import get_client_ip, get_user_agent

router = APIRouter(prefix="/bookings", tags=["booking-cancellations"])


@router.post("/{booking_id}/cancel", response_model=BookingCancelResponse)
def cancel_booking(
    booking_id: str,
    payload: BookingCancelRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingCancelResponse:
    service = build_booking_cancellation_service(db)

    booking, payment, refund = service.cancel_booking(
        booking_id=booking_id,
        user_id=str(current_user.id),
        payload=payload,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    refund_amount = refund.amount if refund else 0
    refund_currency = refund.currency if refund else booking.currency
    refund_status = enum_to_str(refund.status) if refund else None

    return BookingCancelResponse(
        booking_id=str(booking.id),
        booking_code=booking.booking_code,
        status=enum_to_str(booking.status),
        payment_status=enum_to_str(booking.payment_status),
        refund_amount=refund_amount,
        refund_currency=refund_currency,
        refund_status=refund_status,
        cancellation_reason=booking.cancellation_reason,
    )
