from datetime import datetime

from pydantic import BaseModel, Field


class CreateSupportTicketRequest(BaseModel):
    full_name: str
    email: str
    topic_id: str
    subject: str
    message: str
    booking_reference: str | None = None


class SupportTicketReplyResponse(BaseModel):
    id: str
    author_name: str
    author_role: str
    message: str
    created_at: datetime


class SupportTicketReplyCreateRequest(BaseModel):
    message: str
    status: str | None = None


class AdminSupportTicketUpdateRequest(BaseModel):
    status: str


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
