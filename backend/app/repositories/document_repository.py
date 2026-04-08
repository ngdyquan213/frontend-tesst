from sqlalchemy.orm import Session

from app.models.document import UploadedDocument
from app.models.enums import DocumentType


class DocumentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_document(self, document: UploadedDocument) -> UploadedDocument:
        self.db.add(document)
        self.db.flush()
        return document

    def list_by_user_id(
        self, user_id: str, skip: int = 0, limit: int = 20
    ) -> list[UploadedDocument]:
        return (
            self.db.query(UploadedDocument)
            .filter(
                UploadedDocument.user_id == user_id,
                UploadedDocument.deleted_at.is_(None),
            )
            .order_by(UploadedDocument.uploaded_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_user_id(self, user_id: str) -> int:
        return self.db.query(UploadedDocument).filter(UploadedDocument.user_id == user_id).count()

    def get_by_id(self, document_id: str) -> UploadedDocument | None:
        return self.db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()

    def get_by_id_and_user_id(self, document_id: str, user_id: str) -> UploadedDocument | None:
        return (
            self.db.query(UploadedDocument)
            .filter(
                UploadedDocument.id == document_id,
                UploadedDocument.user_id == user_id,
                UploadedDocument.deleted_at.is_(None),
            )
            .first()
        )

    def get_latest_voucher_by_booking_id_and_user_id(
        self,
        booking_id: str,
        user_id: str,
    ) -> UploadedDocument | None:
        return (
            self.db.query(UploadedDocument)
            .filter(
                UploadedDocument.user_id == user_id,
                UploadedDocument.booking_id == booking_id,
                UploadedDocument.document_type == DocumentType.voucher,
                UploadedDocument.deleted_at.is_(None),
            )
            .order_by(UploadedDocument.uploaded_at.desc())
            .first()
        )
