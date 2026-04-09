from typing import Any

from pydantic import BaseModel, Field


class ClientRuntimeErrorRequest(BaseModel):
    source: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=2000)
    stack: str | None = Field(default=None, max_length=12000)
    route: str | None = Field(default=None, max_length=500)
    userAgent: str | None = Field(default=None, max_length=1000)
    metadata: dict[str, Any] | None = None


class ClientRuntimeErrorResponse(BaseModel):
    accepted: bool = True
