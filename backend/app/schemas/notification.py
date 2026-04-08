from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class NotificationItemResponse(BaseModel):
    id: str
    title: str
    body: str
    type: Literal["booking", "document", "refund", "support"]
    created_at: datetime
    read: bool


class NotificationListResponse(BaseModel):
    items: list[NotificationItemResponse]
