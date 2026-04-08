from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import build_voucher_service, get_current_user
from app.core.database import get_db
from app.schemas.document import DocumentResponse
from app.schemas.voucher import BookingVoucherResponse
from app.utils.request_context import get_client_ip, get_user_agent
from app.utils.response_mappers import document_to_dict

router = APIRouter(prefix="/bookings", tags=["booking-vouchers"])


@router.get("/{booking_id}/voucher", response_model=BookingVoucherResponse)
def get_booking_voucher(
    booking_id: str,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingVoucherResponse:
    service = build_voucher_service(db)
    voucher_payload = service.render_my_booking_voucher(
        booking_id=booking_id,
        user_id=str(current_user.id),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return BookingVoucherResponse(**voucher_payload)


@router.get("/{booking_id}/voucher.pdf")
def export_booking_voucher_pdf(
    booking_id: str,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = build_voucher_service(db)

    pdf_bytes, filename = service.export_my_booking_voucher_pdf(
        booking_id=booking_id,
        user_id=str(current_user.id),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/{booking_id}/voucher/generate",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_booking_voucher_document(
    booking_id: str,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    service = build_voucher_service(db)

    document = service.generate_and_store_my_booking_voucher(
        booking_id=booking_id,
        user_id=str(current_user.id),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )

    return DocumentResponse(**document_to_dict(document))
