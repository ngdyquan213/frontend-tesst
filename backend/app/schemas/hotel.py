from decimal import Decimal

from pydantic import BaseModel


class HotelRoomResponse(BaseModel):
    id: str
    hotel_id: str
    room_type: str
    capacity: int
    base_price_per_night: Decimal
    total_rooms: int
    available_rooms: int | None = None


class HotelResponse(BaseModel):
    id: str
    name: str
    city: str
    country: str
    address: str | None = None
    star_rating: int | None = None
    description: str | None = None
    rooms: list[HotelRoomResponse] = []
