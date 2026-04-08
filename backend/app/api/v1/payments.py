from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import (
    build_payment_callback_service,
    build_payment_service,
    get_current_user,
)
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AppException, NotFoundAppException
from app.schemas.payment import (
    PaymentCallbackRequest,
    PaymentCallbackResponse,
    PaymentInitiateRequest,
    PaymentResponse,
    PaymentStatusResponse,
)
from app.utils.enums import enum_to_str
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import payment_to_dict

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initiate", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def initiate_payment(
    payload: PaymentInitiateRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> PaymentResponse:
    service = build_payment_service(db)

    payment = service.initiate_payment(
        booking_id=payload.booking_id,
        user_id=str(current_user.id),
        payment_method=payload.payment_method,
        idempotency_key=idempotency_key,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return PaymentResponse(**payment_to_dict(payment))


@router.post("/callback", response_model=PaymentCallbackResponse)
def payment_callback(
    payload: PaymentCallbackRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> PaymentCallbackResponse:
    service = build_payment_callback_service(db)

    try:
        payment, _booking = service.process_callback(
            gateway_name=payload.gateway_name,
            gateway_order_ref=payload.gateway_order_ref,
            gateway_transaction_ref=payload.gateway_transaction_ref,
            amount=str(payload.amount),
            currency=payload.currency,
            status=payload.status,
            signature=payload.signature,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return PaymentCallbackResponse(
        success=True,
        message="Payment callback processed",
        **payment_to_dict(payment),
    )


@router.post("/callback/stripe", response_model=PaymentCallbackResponse)
async def stripe_payment_callback(
    request: Request,
    stripe_signature: str = Header(..., alias="Stripe-Signature"),
    db: Session = Depends(get_db),
) -> PaymentCallbackResponse:
    service = build_payment_callback_service(db)
    raw_body = await request.body()

    try:
        payment, _booking = service.process_stripe_webhook(
            raw_body=raw_body,
            signature_header=stripe_signature,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return PaymentCallbackResponse(
        success=True,
        message="Payment callback processed",
        **payment_to_dict(payment),
    )


@router.post("/{payment_id}/simulate-success", response_model=PaymentResponse)
def simulate_payment_success(
    payment_id: str,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    if not settings.ALLOW_PAYMENT_SIMULATION:
        raise NotFoundAppException("Payment simulation is disabled")

    service = build_payment_service(db)

    try:
        payment = service.simulate_success(
            payment_id=payment_id,
            user_id=str(current_user.id),
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return PaymentResponse(**payment_to_dict(payment))


@router.get("/booking/{booking_id}", response_model=PaymentStatusResponse)
def get_booking_payment_status(
    booking_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentStatusResponse:
    service = build_payment_service(db)
    booking, payment = service.get_booking_payment_status(
        booking_id=booking_id,
        user_id=str(current_user.id),
    )
    if not booking:
        return PaymentStatusResponse(
            booking_id=booking_id,
            booking_payment_status="not_found",
            payment=None,
        )

    return PaymentStatusResponse(
        booking_id=str(booking.id),
        booking_payment_status=enum_to_str(booking.payment_status),
        payment=PaymentResponse(**payment_to_dict(payment)) if payment else None,
    )
