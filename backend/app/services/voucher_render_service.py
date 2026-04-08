from __future__ import annotations

from app.models.enums import BookingItemType
from app.utils.enums import enum_to_str


class VoucherRenderService:
    def resolve_voucher_type(self, booking) -> str:
        if not booking.items:
            return "booking"

        item_types = {enum_to_str(item.item_type) for item in booking.items}

        if len(item_types) == 1:
            item_type = next(iter(item_types))
            if item_type == BookingItemType.flight.value:
                return "flight_booking_confirmation"
            if item_type == BookingItemType.hotel.value:
                return "hotel_booking_voucher"
            if item_type == BookingItemType.tour.value:
                return "tour_booking_voucher"

        return "travel_booking_voucher"

    def build_item_title_and_description(self, item) -> tuple[str | None, str, str | None]:
        reference_id = None
        title = "Booking Item"
        description = None

        item_type = enum_to_str(item.item_type)

        if item_type == BookingItemType.flight.value and item.flight is not None:
            reference_id = str(item.flight.id)
            title = f"Flight {item.flight.flight_number}"
            description = (
                f"{item.flight.departure_airport.code} -> {item.flight.arrival_airport.code}"
                if item.flight.departure_airport and item.flight.arrival_airport
                else "Flight booking"
            )
        elif item_type == BookingItemType.hotel.value and item.hotel_room is not None:
            reference_id = str(item.hotel_room.id)
            title = f"Hotel Room - {item.hotel_room.room_type}"
            description = item.hotel_room.hotel.name if item.hotel_room.hotel else "Hotel booking"
        elif item_type == BookingItemType.tour.value and item.tour_schedule is not None:
            reference_id = str(item.tour_schedule.id)
            title = item.tour_schedule.tour.name if item.tour_schedule.tour else "Tour booking"
            description = (
                (
                    f"{item.tour_schedule.tour.destination} | "
                    f"{item.tour_schedule.departure_date} -> {item.tour_schedule.return_date}"
                )
                if item.tour_schedule.tour
                else "Tour booking"
            )

        return reference_id, title, description
