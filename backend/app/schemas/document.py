from datetime import datetime

from pydantic import BaseModel

from app.models.enums import DocumentType


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    booking_id: str | None = None
    traveler_id: str | None = None
    document_type: DocumentType
    original_filename: str
    mime_type: str
    file_size: int
    storage_bucket: str
    is_private: bool
    uploaded_at: datetime
