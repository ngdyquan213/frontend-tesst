import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import (
    build_checkout_service,
    build_payment_callback_service,
    build_payment_service,
    get_current_user,
)
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AppException, NotFoundAppException
from app.core.logging import build_log_extra
from app.models.enums import PaymentMethod
from app.schemas.booking import BookingResponse
from app.schemas.payment import (
    PaymentCallbackRequest,
    PaymentCallbackResponse,
    PaymentCheckoutResponse,
    PaymentInitiateRequest,
    PaymentMethodOptionResponse,
    PaymentResponse,
    PaymentStatusResponse,
    TourCheckoutRequest,
)
from app.services.payment_gateway_service import PaymentGatewayService
from app.utils.enums import enum_to_str
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import booking_to_dict, payment_to_dict

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)


def _build_available_payment_methods() -> list[PaymentMethodOptionResponse]:
    method_options = {
        PaymentMethod.manual: PaymentMethodOptionResponse(
            id=PaymentMethod.manual.value,
            type="bank",
            title="Manual Settlement",
            description="Create the booking now and settle payment with the operations team.",
        ),
        PaymentMethod.vnpay: PaymentMethodOptionResponse(
            id=PaymentMethod.vnpay.value,
            type="wallet",
            title="VNPay",
            description="Redirect checkout through the VNPay gateway.",
        ),
        PaymentMethod.momo: PaymentMethodOptionResponse(
            id=PaymentMethod.momo.value,
            type="wallet",
            title="MoMo",
            description="Use your MoMo wallet for supported payments.",
        ),
        PaymentMethod.stripe: PaymentMethodOptionResponse(
            id=PaymentMethod.stripe.value,
            type="card",
            title="Card via Stripe",
            description="Visa, Mastercard, and other supported cards through Stripe.",
        ),
    }
    available_methods = PaymentGatewayService().get_available_payment_methods()
    return [method_options[method] for method in available_methods]


@router.get("/methods", response_model=list[PaymentMethodOptionResponse])
def list_payment_methods() -> list[PaymentMethodOptionResponse]:
    return _build_available_payment_methods()


@router.post(
    "/checkout/tours",
    response_model=PaymentCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tour_checkout(
    payload: TourCheckoutRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> PaymentCheckoutResponse:
    service = build_checkout_service(db)

    booking, payment = service.create_tour_checkout(
        user_id=str(current_user.id),
        user_email=current_user.email,
        user_full_name=current_user.full_name,
        payload=payload,
        payment_method=payload.payment_method,
        idempotency_key=idempotency_key,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return PaymentCheckoutResponse(
        booking=BookingResponse(**booking_to_dict(booking)),
        payment=PaymentResponse(**payment_to_dict(payment)),
    )


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
            callback_timestamp=payload.timestamp,
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
        logger.exception(
            "payment_callback_unhandled_error",
            extra=build_log_extra(
                "payment_callback_unhandled_error",
                gateway_name=payload.gateway_name,
                gateway_order_ref=payload.gateway_order_ref,
                gateway_transaction_ref=payload.gateway_transaction_ref,
            ),
        )
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
        logger.exception(
            "stripe_payment_callback_unhandled_error",
            extra=build_log_extra("stripe_payment_callback_unhandled_error"),
        )
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
        logger.exception(
            "payment_simulation_unhandled_error",
            extra=build_log_extra(
                "payment_simulation_unhandled_error",
                payment_id=payment_id,
                user_id=str(current_user.id),
            ),
        )
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return PaymentResponse(**payment_to_dict(payment))


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    service = build_payment_service(db)
    payment = service.get_payment(
        payment_id=payment_id,
        user_id=str(current_user.id),
    )
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
