from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import TourScheduleStatus, TourStatus, TravelerType


class AdminTourCreateRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=255)
    destination: str = Field(min_length=1, max_length=255)
    description: str | None = None
    duration_days: int = Field(ge=1, le=30)
    duration_nights: int = Field(ge=0, le=30)
    meeting_point: str | None = Field(default=None, max_length=255)
    tour_type: str | None = Field(default=None, max_length=100)
    status: TourStatus = TourStatus.active


class AdminTourUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    destination: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    duration_days: int | None = Field(default=None, ge=1, le=30)
    duration_nights: int | None = Field(default=None, ge=0, le=30)
    meeting_point: str | None = Field(default=None, max_length=255)
    tour_type: str | None = Field(default=None, max_length=100)
    status: TourStatus | None = None


class AdminTourResponse(BaseModel):
    id: str
    code: str
    name: str
    destination: str
    description: str | None = None
    duration_days: int
    duration_nights: int
    meeting_point: str | None = None
    tour_type: str | None = None
    status: TourStatus


class AdminTourScheduleCreateRequest(BaseModel):
    departure_date: date
    return_date: date
    capacity: int = Field(ge=1, le=500)
    available_slots: int = Field(ge=0, le=500)
    status: TourScheduleStatus = TourScheduleStatus.scheduled


class AdminTourScheduleUpdateRequest(BaseModel):
    departure_date: date | None = None
    return_date: date | None = None
    capacity: int | None = Field(default=None, ge=1, le=500)
    available_slots: int | None = Field(default=None, ge=0, le=500)
    status: TourScheduleStatus | None = None


class AdminTourScheduleResponse(BaseModel):
    id: str
    tour_id: str
    departure_date: date
    return_date: date
    capacity: int
    available_slots: int
    status: TourScheduleStatus


class AdminTourPriceRuleCreateRequest(BaseModel):
    traveler_type: TravelerType
    price: Decimal = Field(ge=0)
    currency: str = "VND"


class AdminTourPriceRuleResponse(BaseModel):
    id: str
    tour_schedule_id: str
    traveler_type: TravelerType
    price: Decimal
    currency: str
