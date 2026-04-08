from pydantic import BaseModel, EmailStr

from app.models.enums import UserStatus


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str | None = None
    full_name: str
    status: UserStatus
