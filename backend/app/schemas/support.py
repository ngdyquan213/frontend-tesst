from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

SUPPORT_BOOKING_REFERENCE_PATTERN = r"^[A-Za-z0-9-]{5,20}$"
SUPPORT_STATUS_PATTERN = r"^(open|in_review|waiting_for_traveler|resolved)$"


class CreateSupportTicketRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    topic_id: str = Field(min_length=1, max_length=64)
    subject: str = Field(min_length=8, max_length=200)
    message: str = Field(min_length=24, max_length=4000)
    booking_reference: str | None = Field(
        default=None,
        min_length=5,
        max_length=20,
        pattern=SUPPORT_BOOKING_REFERENCE_PATTERN,
    )


class SupportTicketReplyResponse(BaseModel):
    id: str
    author_name: str
    author_role: str
    message: str
    created_at: datetime


class SupportTicketReplyCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(min_length=4, max_length=4000)
    status: str | None = Field(default=None, pattern=SUPPORT_STATUS_PATTERN)


class AdminSupportTicketUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: str = Field(pattern=SUPPORT_STATUS_PATTERN)


class SupportTicketResponse(BaseModel):
    id: str
    reference: str
    topic_id: str
    subject: str
    requester_name: str
    requester_email: str
    booking_reference: str | None = None
    status: str
    message_preview: str
    created_at: datetime
    updated_at: datetime


class SupportTicketDetailResponse(SupportTicketResponse):
    message: str
    replies: list[SupportTicketReplyResponse] = Field(default_factory=list)
