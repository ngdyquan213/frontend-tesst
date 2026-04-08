from __future__ import annotations

from app.utils.enums import enum_to_str


def booking_to_dict(booking) -> dict:
    return {
        "id": str(booking.id),
        "booking_code": booking.booking_code,
        "user_id": str(booking.user_id),
        "status": enum_to_str(booking.status),
        "total_base_amount": booking.total_base_amount,
        "total_discount_amount": booking.total_discount_amount,
        "total_final_amount": booking.total_final_amount,
        "currency": booking.currency,
        "payment_status": enum_to_str(booking.payment_status),
        "booked_at": booking.booked_at,
    }


def flight_to_dict(flight) -> dict:
    return {
        "id": str(flight.id),
        "airline_id": str(flight.airline_id),
        "flight_number": flight.flight_number,
        "departure_airport_id": str(flight.departure_airport_id),
        "arrival_airport_id": str(flight.arrival_airport_id),
        "departure_time": flight.departure_time,
        "arrival_time": flight.arrival_time,
        "base_price": flight.base_price,
        "available_seats": flight.available_seats,
        "status": enum_to_str(flight.status),
    }


def payment_to_dict(payment) -> dict:
    return {
        "id": str(payment.id),
        "booking_id": str(payment.booking_id) if payment.booking_id else None,
        "payment_method": enum_to_str(payment.payment_method),
        "status": enum_to_str(payment.status),
        "amount": payment.amount,
        "currency": payment.currency,
        "gateway_order_ref": payment.gateway_order_ref,
        "gateway_transaction_ref": payment.gateway_transaction_ref,
        "gateway_payload": getattr(payment, "gateway_payload", None),
        "paid_at": payment.paid_at,
        "created_at": payment.created_at,
    }


def refund_to_dict(refund) -> dict:
    return {
        "id": str(refund.id),
        "payment_id": str(refund.payment_id),
        "amount": refund.amount,
        "currency": refund.currency,
        "status": enum_to_str(refund.status),
        "reason": refund.reason,
        "processed_at": refund.processed_at,
        "created_at": refund.created_at,
    }


def document_to_dict(document) -> dict:
    return {
        "id": str(document.id),
        "user_id": str(document.user_id),
        "booking_id": str(document.booking_id) if document.booking_id else None,
        "traveler_id": str(document.traveler_id) if document.traveler_id else None,
        "document_type": enum_to_str(document.document_type),
        "original_filename": document.original_filename,
        "mime_type": document.mime_type,
        "file_size": document.file_size,
        "storage_bucket": document.storage_bucket,
        "is_private": document.is_private,
        "uploaded_at": document.uploaded_at,
    }


def hotel_room_to_dict(room, *, available_rooms: int | None = None) -> dict:
    return {
        "id": str(room.id),
        "hotel_id": str(room.hotel_id),
        "room_type": room.room_type,
        "capacity": room.capacity,
        "base_price_per_night": room.base_price_per_night,
        "total_rooms": room.total_rooms,
        "available_rooms": available_rooms,
    }


def hotel_to_dict(hotel, *, availability_map: dict[str, int] | None = None) -> dict:
    return {
        "id": str(hotel.id),
        "name": hotel.name,
        "city": hotel.city,
        "country": hotel.country,
        "address": hotel.address,
        "star_rating": hotel.star_rating,
        "description": hotel.description,
        "rooms": [
            hotel_room_to_dict(
                room,
                available_rooms=availability_map.get(str(room.id)) if availability_map else None,
            )
            for room in hotel.rooms
        ],
    }


def traveler_to_dict(traveler) -> dict:
    return {
        "id": str(traveler.id),
        "booking_id": str(traveler.booking_id),
        "full_name": traveler.full_name,
        "traveler_type": enum_to_str(traveler.traveler_type),
        "date_of_birth": traveler.date_of_birth,
        "passport_number": traveler.passport_number,
        "nationality": traveler.nationality,
        "document_type": enum_to_str(traveler.document_type),
    }


def admin_booking_to_dict(booking) -> dict:
    return {
        "id": str(booking.id),
        "booking_code": booking.booking_code,
        "user_id": str(booking.user_id),
        "status": enum_to_str(booking.status),
        "total_final_amount": booking.total_final_amount,
        "currency": booking.currency,
        "payment_status": enum_to_str(booking.payment_status),
        "booked_at": booking.booked_at,
    }


def admin_refund_to_dict(refund) -> dict:
    return refund_to_dict(refund)


def admin_user_to_dict(user) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "status": enum_to_str(user.status),
    }


def user_to_dict(user) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "status": enum_to_str(user.status),
    }


def admin_payment_to_dict(payment) -> dict:
    return {
        "id": str(payment.id),
        "booking_id": str(payment.booking_id) if payment.booking_id else None,
        "payment_method": enum_to_str(payment.payment_method),
        "status": enum_to_str(payment.status),
        "amount": payment.amount,
        "currency": payment.currency,
        "gateway_order_ref": payment.gateway_order_ref,
        "gateway_transaction_ref": payment.gateway_transaction_ref,
        "created_at": payment.created_at,
    }


def admin_audit_log_to_dict(log) -> dict:
    return {
        "id": str(log.id),
        "actor_type": enum_to_str(log.actor_type),
        "actor_user_id": str(log.actor_user_id) if log.actor_user_id else None,
        "action": log.action,
        "resource_type": log.resource_type,
        "resource_id": str(log.resource_id) if log.resource_id else None,
        "ip_address": log.ip_address,
        "user_agent": log.user_agent,
        "created_at": log.created_at,
    }


def admin_coupon_to_dict(coupon) -> dict:
    def decimal_str(value):
        if value is None:
            return None
        return format(value.normalize(), "f").rstrip("0").rstrip(".") or "0"

    return {
        "id": str(coupon.id),
        "code": coupon.code,
        "name": coupon.name,
        "coupon_type": enum_to_str(coupon.coupon_type),
        "applicable_product_type": enum_to_str(coupon.applicable_product_type),
        "discount_value": decimal_str(coupon.discount_value),
        "max_discount_amount": decimal_str(coupon.max_discount_amount),
        "min_booking_amount": decimal_str(coupon.min_booking_amount),
        "usage_limit_total": coupon.usage_limit_total,
        "usage_limit_per_user": coupon.usage_limit_per_user,
        "used_count": coupon.used_count,
        "is_active": coupon.is_active,
    }


def admin_tour_to_dict(tour) -> dict:
    return {
        "id": str(tour.id),
        "code": tour.code,
        "name": tour.name,
        "destination": tour.destination,
        "description": tour.description,
        "duration_days": tour.duration_days,
        "duration_nights": tour.duration_nights,
        "meeting_point": tour.meeting_point,
        "tour_type": tour.tour_type,
        "status": enum_to_str(tour.status),
    }


def admin_tour_schedule_to_dict(schedule) -> dict:
    return {
        "id": str(schedule.id),
        "tour_id": str(schedule.tour_id),
        "departure_date": schedule.departure_date,
        "return_date": schedule.return_date,
        "capacity": schedule.capacity,
        "available_slots": schedule.available_slots,
        "status": enum_to_str(schedule.status),
    }


def admin_tour_price_rule_to_dict(rule) -> dict:
    return {
        "id": str(rule.id),
        "tour_schedule_id": str(rule.tour_schedule_id),
        "traveler_type": enum_to_str(rule.traveler_type),
        "price": rule.price,
        "currency": rule.currency,
    }


def tour_price_rule_to_dict(rule) -> dict:
    return {
        "id": str(rule.id),
        "traveler_type": enum_to_str(rule.traveler_type),
        "price": rule.price,
        "currency": rule.currency,
    }


def tour_schedule_to_dict(schedule) -> dict:
    return {
        "id": str(schedule.id),
        "departure_date": schedule.departure_date,
        "return_date": schedule.return_date,
        "capacity": schedule.capacity,
        "available_slots": schedule.available_slots,
        "status": enum_to_str(schedule.status),
        "price_rules": [tour_price_rule_to_dict(rule) for rule in schedule.price_rules],
    }


def tour_to_dict(tour) -> dict:
    return {
        "id": str(tour.id),
        "code": tour.code,
        "name": tour.name,
        "destination": tour.destination,
        "description": tour.description,
        "duration_days": tour.duration_days,
        "duration_nights": tour.duration_nights,
        "meeting_point": tour.meeting_point,
        "tour_type": tour.tour_type,
        "status": enum_to_str(tour.status),
        "schedules": [tour_schedule_to_dict(schedule) for schedule in tour.schedules],
        "itineraries": [
            {
                "id": str(itinerary.id),
                "day_number": itinerary.day_number,
                "title": itinerary.title,
                "description": itinerary.description,
            }
            for itinerary in tour.itineraries
        ],
        "policies": [
            {
                "id": str(policy.id),
                "cancellation_policy": policy.cancellation_policy,
                "refund_policy": policy.refund_policy,
                "notes": policy.notes,
            }
            for policy in tour.policies
        ],
    }


def voucher_item_to_dict(
    item, *, reference_id: str | None, title: str, description: str | None
) -> dict:
    return {
        "item_type": enum_to_str(item.item_type),
        "reference_id": reference_id,
        "title": title,
        "description": description,
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "total_price": item.total_price,
        "check_in_date": item.check_in_date,
        "check_out_date": item.check_out_date,
    }


def voucher_traveler_to_dict(traveler) -> dict:
    return {
        "full_name": traveler.full_name,
        "traveler_type": enum_to_str(traveler.traveler_type),
        "passport_number": traveler.passport_number,
        "nationality": traveler.nationality,
        "document_type": enum_to_str(traveler.document_type),
    }


def booking_voucher_to_dict(
    booking,
    *,
    voucher_type: str,
    items: list[dict],
    travelers: list[dict],
) -> dict:
    return {
        "booking_id": str(booking.id),
        "booking_code": booking.booking_code,
        "booking_status": enum_to_str(booking.status),
        "payment_status": enum_to_str(booking.payment_status),
        "booked_at": booking.booked_at,
        "customer_name": booking.user.full_name if booking.user else "Unknown",
        "customer_email": booking.user.email if booking.user else "unknown@example.com",
        "currency": booking.currency,
        "total_base_amount": booking.total_base_amount,
        "total_discount_amount": booking.total_discount_amount,
        "total_final_amount": booking.total_final_amount,
        "voucher_type": voucher_type,
        "items": items,
        "travelers": travelers,
        "notes": booking.notes,
    }
