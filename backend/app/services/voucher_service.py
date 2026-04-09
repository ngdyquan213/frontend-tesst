from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationAppException, NotFoundAppException
from app.models.enums import BookingStatus, LogActorType, PaymentStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.document_repository import DocumentRepository
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.pdf_voucher_service import PDFVoucherService
from app.services.voucher_document_service import VoucherDocumentService
from app.services.voucher_render_service import VoucherRenderService
from app.utils.response_mappers import (
    booking_voucher_to_dict,
    voucher_item_to_dict,
    voucher_traveler_to_dict,
)
from app.workers.email_worker import EmailWorker


class VoucherService(ApplicationService):
    def __init__(
        self,
        db: Session,
        booking_repo: BookingRepository,
        audit_service: AuditService,
        document_repo: DocumentRepository,
        pdf_voucher_service: PDFVoucherService,
        email_worker: EmailWorker,
        voucher_render_service: VoucherRenderService,
        voucher_document_service: VoucherDocumentService,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.audit_service = audit_service
        self.document_repo = document_repo
        self.pdf_voucher_service = pdf_voucher_service
        self.email_worker = email_worker
        self.voucher_render_service = voucher_render_service
        self.voucher_document_service = voucher_document_service

    def _resolve_voucher_type(self, booking) -> str:
        return self.voucher_render_service.resolve_voucher_type(booking)

    def _build_item_title_and_description(self, item) -> tuple[str | None, str, str | None]:
        return self.voucher_render_service.build_item_title_and_description(item)

    @staticmethod
    def _booking_has_issued_voucher_access(booking) -> bool:
        return (
            booking.status == BookingStatus.confirmed
            and booking.payment_status == PaymentStatus.paid
        )

    def _assert_booking_voucher_is_available(self, booking) -> None:
        if self._booking_has_issued_voucher_access(booking):
            return

        raise AuthorizationAppException(
            "Voucher is available only after the booking is confirmed and fully paid"
        )

    def list_my_voucher_summaries(
        self,
        *,
        user_id: str,
    ) -> list[dict]:
        bookings = [
            booking
            for booking in self.booking_repo.list_all_by_user_id(user_id)
            if self._booking_has_issued_voucher_access(booking)
        ]
        return [
            {
                "booking_id": str(booking.id),
                "booking_code": booking.booking_code,
                "issued_at": booking.booked_at,
            }
            for booking in bookings
        ]

    def get_my_booking_voucher(
        self,
        *,
        booking_id: str,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            raise NotFoundAppException("Booking not found")
        self._assert_booking_voucher_is_available(booking)

        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=booking.user_id,
            action="booking_voucher_viewed",
            resource_type="booking",
            resource_id=booking.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"booking_code": booking.booking_code},
        )
        self.commit()
        return booking

    def render_my_booking_voucher(
        self,
        *,
        booking_id: str,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        booking = self.get_my_booking_voucher(
            booking_id=booking_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        voucher_type = self._resolve_voucher_type(booking)
        items = []
        for item in booking.items:
            reference_id, title, description = self._build_item_title_and_description(item)
            items.append(
                voucher_item_to_dict(
                    item,
                    reference_id=reference_id,
                    title=title,
                    description=description,
                )
            )
        travelers = [voucher_traveler_to_dict(traveler) for traveler in booking.travelers]
        return booking_voucher_to_dict(
            booking,
            voucher_type=voucher_type,
            items=items,
            travelers=travelers,
        )

    def export_my_booking_voucher_pdf(
        self,
        *,
        booking_id: str,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[bytes, str]:
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            raise NotFoundAppException("Booking not found")
        self._assert_booking_voucher_is_available(booking)

        pdf_bytes, filename = self.voucher_document_service.export_pdf(
            booking=booking,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.commit()
        return pdf_bytes, filename

    def generate_and_store_my_booking_voucher(
        self,
        *,
        booking_id: str,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ):
        booking = self.booking_repo.get_by_id_and_user_id(booking_id, user_id)
        if not booking:
            raise NotFoundAppException("Booking not found")
        self._assert_booking_voucher_is_available(booking)

        return self.voucher_document_service.generate_and_store(
            booking=booking,
            ip_address=ip_address,
            user_agent=user_agent,
        )
