from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import build_coupon_service, get_current_user
from app.core.database import get_db
from app.core.exceptions import AppException
from app.schemas.coupon import CouponApplyRequest, CouponApplyResponse
from app.utils.enums import enum_to_str
from app.utils.request_context import get_client_ip, get_user_agent

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.post("/apply", response_model=CouponApplyResponse)
def apply_coupon(
    payload: CouponApplyRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CouponApplyResponse:
    service = build_coupon_service(db)

    try:
        booking, coupon = service.apply_coupon(
            user_id=str(current_user.id),
            payload=payload,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except AppException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc

    return CouponApplyResponse(
        booking_id=str(booking.id),
        booking_code=booking.booking_code,
        coupon_id=str(coupon.id),
        coupon_code=coupon.code,
        coupon_name=coupon.name,
        applicable_product_type=enum_to_str(coupon.applicable_product_type),
        total_base_amount=booking.total_base_amount,
        total_discount_amount=booking.total_discount_amount,
        total_final_amount=booking.total_final_amount,
        currency=booking.currency,
    )
