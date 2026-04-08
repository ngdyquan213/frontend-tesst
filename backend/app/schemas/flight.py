from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class FlightResponse(BaseModel):
    id: str
    airline_id: str
    flight_number: str
    departure_airport_id: str
    arrival_airport_id: str
    departure_time: datetime
    arrival_time: datetime
    base_price: Decimal
    available_seats: int
    status: str
