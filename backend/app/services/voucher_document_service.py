from __future__ import annotations

from app.models.document import UploadedDocument
from app.models.enums import DocumentType, LogActorType
from app.repositories.document_repository import DocumentRepository
from app.services.application_service import ApplicationService
from app.services.audit_service import AuditService
from app.services.outbox_service import OutboxService
from app.services.pdf_voucher_service import PDFVoucherService
from app.services.storage_service import StorageService
from app.workers.email_worker import EmailWorker


class VoucherDocumentService(ApplicationService):
    def __init__(
        self,
        document_repo: DocumentRepository,
        audit_service: AuditService,
        pdf_voucher_service: PDFVoucherService,
        email_worker: EmailWorker,
        storage_service: StorageService | None = None,
        outbox_service: OutboxService | None = None,
    ) -> None:
        self.db = document_repo.db
        self.document_repo = document_repo
        self.audit_service = audit_service
        self.pdf_voucher_service = pdf_voucher_service
        self.email_worker = email_worker
        self.storage_service = storage_service or StorageService()
        self.outbox_service = outbox_service or OutboxService(
            db=document_repo.db,
            email_worker=email_worker,
        )

    def export_pdf(
        self, *, booking, ip_address: str | None = None, user_agent: str | None = None
    ) -> tuple[bytes, str]:
        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=booking.user_id,
            action="booking_voucher_pdf_exported",
            resource_type="booking",
            resource_id=booking.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"booking_code": booking.booking_code},
        )

        pdf_bytes = self.pdf_voucher_service.generate_pdf_bytes(booking)
        filename = f"{booking.booking_code}.pdf"
        return pdf_bytes, filename

    def generate_and_store(
        self,
        *,
        booking,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> UploadedDocument:
        pdf_bytes = self.pdf_voucher_service.generate_pdf_bytes(booking)
        original_filename = f"{booking.booking_code}.pdf"
        stored_object = self.storage_service.store_bytes(
            content=pdf_bytes,
            original_filename=original_filename,
            mime_type="application/pdf",
        )

        try:
            document = UploadedDocument(
                user_id=booking.user_id,
                booking_id=booking.id,
                traveler_id=None,
                document_type=DocumentType.voucher,
                original_filename=original_filename,
                stored_filename=stored_object.stored_filename,
                mime_type="application/pdf",
                file_size=stored_object.file_size,
                storage_bucket=stored_object.storage_bucket,
                storage_key=stored_object.storage_key,
                checksum_sha256=stored_object.checksum_sha256,
                is_private=True,
            )
            self.document_repo.add_document(document)

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="booking_voucher_generated",
                resource_type="uploaded_document",
                resource_id=document.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={
                    "booking_id": str(booking.id),
                    "booking_code": booking.booking_code,
                    "document_type": "voucher",
                    "storage_bucket": stored_object.storage_bucket,
                    "storage_key": stored_object.storage_key,
                },
            )

            if booking.user:
                self.outbox_service.enqueue_email(
                    handler="send_voucher_generated_email",
                    kwargs={
                        "to_email": booking.user.email,
                        "full_name": booking.user.full_name,
                        "booking_code": booking.booking_code,
                        "voucher_filename": original_filename,
                    },
                )

            self.commit_and_refresh(document)
        except Exception:
            self.document_repo.db.rollback()
            self.storage_service.delete_object(
                storage_bucket=stored_object.storage_bucket,
                storage_key=stored_object.storage_key,
            )
            raise
        return document
