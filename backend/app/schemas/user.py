from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import UserStatus


class UserUpdateRequest(BaseModel):
    full_name: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str | None = None
    full_name: str
    status: UserStatus
    role: str
    roles: list[str] = []
    permissions: list[str] = []
    email_verified: bool = False
    created_at: datetime
    updated_at: datetime
