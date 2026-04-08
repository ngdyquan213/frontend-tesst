from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import TourScheduleStatus, TourStatus, TravelerType


class TourPriceRuleResponse(BaseModel):
    id: str
    traveler_type: TravelerType
    price: Decimal
    currency: str


class TourScheduleResponse(BaseModel):
    id: str
    departure_date: date
    return_date: date
    capacity: int
    available_slots: int
    status: TourScheduleStatus
    price_rules: list[TourPriceRuleResponse] = []


class TourItineraryResponse(BaseModel):
    id: str
    day_number: int
    title: str
    description: str | None = None


class TourPolicyResponse(BaseModel):
    id: str
    cancellation_policy: str | None = None
    refund_policy: str | None = None
    notes: str | None = None


class TourResponse(BaseModel):
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
    schedules: list[TourScheduleResponse] = []
    itineraries: list[TourItineraryResponse] = []
    policies: list[TourPolicyResponse] = []
