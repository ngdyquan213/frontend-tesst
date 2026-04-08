from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import DocumentType, TravelerType


class TravelerCreateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    traveler_type: TravelerType
    date_of_birth: date | None = None
    passport_number: str | None = Field(default=None, max_length=100)
    nationality: str | None = Field(default=None, max_length=100)
    document_type: DocumentType | None = None


class TravelerResponse(BaseModel):
    id: str
    booking_id: str
    full_name: str
    traveler_type: TravelerType
    date_of_birth: date | None = None
    passport_number: str | None = None
    nationality: str | None = None
    document_type: DocumentType | None = None
