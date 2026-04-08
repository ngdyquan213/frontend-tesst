from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    detail: dict[str, Any] | None = None
    timestamp: datetime
    path: str
