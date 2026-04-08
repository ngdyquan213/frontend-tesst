from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from decimal import Decimal

from app.core.exceptions import ConflictAppException, NotFoundAppException, ValidationAppException
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    LogActorType,
    PaymentMethod,
    PaymentStatus,
    TourScheduleStatus,
    TravelerType,
)
from app.models.payment import Payment
from app.services.application_service import ApplicationService
from app.services.outbox_service import OutboxService
from app.utils.ip_utils import normalize_ip

PAYMENT_REFERENCE_MAX_LENGTH = 255


class CheckoutService(ApplicationService):
    def __init__(
        self,
        *,
        db,
        booking_repo,
        tour_repo,
        payment_repo,
        audit_service,
        email_worker,
        notification_worker,
        gateway_service,
        outbox_service: OutboxService | None = None,
    ) -> None:
        self.db = db
        self.booking_repo = booking_repo
        self.tour_repo = tour_repo
        self.payment_repo = payment_repo
        self.audit_service = audit_service
        self.email_worker = email_worker
        self.notification_worker = notification_worker
        self.gateway_service = gateway_service
        self.outbox_service = outbox_service or OutboxService(
            db=db,
            email_worker=email_worker,
            notification_worker=notification_worker,
        )

    @staticmethod
    def _build_tour_checkout_booking_code(*, user_id: str, idempotency_key: str) -> str:
        digest = hashlib.sha256(f"{user_id}:{idempotency_key}".encode("utf-8")).hexdigest()
        return f"TC-{digest[:12].upper()}"

    @staticmethod
    def _assert_idempotent_request_matches_existing_payment(
        *,
        existing: Payment,
        payment_method: PaymentMethod,
        amount: Decimal,
        currency: str,
    ) -> None:
        if existing.payment_method != payment_method:
            raise ConflictAppException(
                "Idempotency key was already used with a different payment method"
            )

        if Decimal(existing.amount) != amount or existing.currency != currency:
            raise ConflictAppException(
                "Idempotency key was already used with different payment parameters"
            )

    @staticmethod
    def _assert_existing_tour_checkout_matches_request(*, booking: Booking, payload) -> None:
        item = booking.items[0] if booking.items else None
        metadata = item.metadata_json if item and item.metadata_json else {}

        if item is None or item.item_type != BookingItemType.tour:
            raise ConflictAppException("Idempotency key was already used for a different booking")

        if str(item.tour_schedule_id) != payload.tour_schedule_id:
            raise ConflictAppException(
                "Idempotency key was already used for a different tour schedule"
            )

        expected_counts = {
            "adult_count": payload.adult_count,
            "child_count": payload.child_count,
            "infant_count": payload.infant_count,
        }
        current_counts = {
            "adult_count": int(metadata.get("adult_count", 0)),
            "child_count": int(metadata.get("child_count", 0)),
            "infant_count": int(metadata.get("infant_count", 0)),
        }
        if current_counts != expected_counts:
            raise ConflictAppException(
                "Idempotency key was already used with different traveler counts"
            )

    def _create_payment(
        self,
        *,
        booking: Booking,
        payment_method: PaymentMethod,
        idempotency_key: str,
        ip_address: str | None,
        user_agent: str | None,
    ) -> Payment:
        amount = Decimal(booking.total_final_amount)
        if amount <= Decimal("0.00"):
            raise ValidationAppException("Invalid payment amount")

        self.gateway_service.assert_gateway_is_configured(payment_method=payment_method)

        gateway_order_ref = f"PAY-{booking.booking_code}-{idempotency_key}"
        if len(gateway_order_ref) > PAYMENT_REFERENCE_MAX_LENGTH:
            raise ValidationAppException("Idempotency key is too long")

        payment = Payment(
            booking_id=booking.id,
            initiated_by=booking.user_id,
            payment_method=payment_method,
            status=PaymentStatus.pending,
            amount=amount,
            currency=booking.currency,
            gateway_order_ref=gateway_order_ref,
            gateway_transaction_ref=None,
            idempotency_key=idempotency_key,
            paid_at=None,
        )
        self.payment_repo.add_payment(payment)

        gateway_result = self.gateway_service.create_payment_session(payment=payment)
        if gateway_result is not None:
            payment.gateway_transaction_ref = gateway_result.external_reference
            payment.gateway_payload = gateway_result.gateway_payload

        self.audit_service.log_action(
            actor_type=LogActorType.user,
            actor_user_id=booking.user_id,
            action="payment_initiated",
            resource_type="payment",
            resource_id=payment.id,
            ip_address=normalize_ip(ip_address),
            user_agent=user_agent,
            metadata={
                "booking_id": str(booking.id),
                "booking_code": booking.booking_code,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "payment_method": payment_method.value,
                "gateway_order_ref": gateway_order_ref,
            },
        )

        return payment

    def create_tour_checkout(
        self,
        *,
        user_id: str,
        user_email: str | None,
        user_full_name: str | None,
        payload,
        payment_method: PaymentMethod,
        idempotency_key: str | None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[Booking, Payment]:
        if not idempotency_key:
            raise ValidationAppException("Idempotency key is required")

        booking_code = self._build_tour_checkout_booking_code(
            user_id=user_id,
            idempotency_key=idempotency_key,
        )
        existing_booking = self.booking_repo.get_by_booking_code_and_user_id(booking_code, user_id)
        if existing_booking is not None:
            self._assert_existing_tour_checkout_matches_request(
                booking=existing_booking,
                payload=payload,
            )
            existing_payment = self.payment_repo.get_by_booking_and_idempotency_key(
                booking_id=str(existing_booking.id),
                idempotency_key=idempotency_key,
            )
            amount = Decimal(existing_booking.total_final_amount)
            if existing_payment is not None:
                self._assert_idempotent_request_matches_existing_payment(
                    existing=existing_payment,
                    payment_method=payment_method,
                    amount=amount,
                    currency=existing_booking.currency,
                )
                gateway_payload = self.gateway_service.build_existing_gateway_payload(
                    payment=existing_payment
                )
                if gateway_payload is not None:
                    existing_payment.gateway_payload = gateway_payload
                return existing_booking, existing_payment

            payment = self._create_payment(
                booking=existing_booking,
                payment_method=payment_method,
                idempotency_key=idempotency_key,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            self.commit_and_refresh(existing_booking, payment)
            return existing_booking, payment

        with self.db.begin_nested():
            schedule = self.tour_repo.get_schedule_by_id_for_update(payload.tour_schedule_id)
            if not schedule:
                raise NotFoundAppException("Tour schedule not found")

            if schedule.status != TourScheduleStatus.scheduled:
                raise ValidationAppException("Tour schedule is not bookable")

            total_travelers = payload.adult_count + payload.child_count + payload.infant_count
            if schedule.available_slots < total_travelers:
                raise ValidationAppException("Not enough available slots")

            price_map = {rule.traveler_type: Decimal(rule.price) for rule in schedule.price_rules}
            adult_price = price_map.get(TravelerType.adult)
            if adult_price is None:
                raise ValidationAppException("Adult pricing is missing for this tour schedule")

            child_price = price_map.get(TravelerType.child, Decimal("0.00"))
            infant_price = price_map.get(TravelerType.infant, Decimal("0.00"))

            total_price = (
                adult_price * payload.adult_count
                + child_price * payload.child_count
                + infant_price * payload.infant_count
            )

            booking = Booking(
                booking_code=booking_code,
                user_id=user_id,
                status=BookingStatus.pending,
                total_base_amount=total_price,
                total_discount_amount=Decimal("0.00"),
                total_final_amount=total_price,
                currency="VND",
                payment_status=PaymentStatus.pending,
                booked_at=datetime.now(timezone.utc),
            )
            self.booking_repo.add_booking(booking)

            item = BookingItem(
                booking_id=booking.id,
                item_type=BookingItemType.tour,
                tour_schedule_id=schedule.id,
                quantity=total_travelers,
                unit_price=total_price,
                total_price=total_price,
                metadata_json={
                    "adult_count": payload.adult_count,
                    "child_count": payload.child_count,
                    "infant_count": payload.infant_count,
                    "tour_id": str(schedule.tour_id),
                    "departure_date": schedule.departure_date.isoformat(),
                    "return_date": schedule.return_date.isoformat(),
                },
            )
            self.booking_repo.add_booking_item(item)

            schedule.available_slots -= total_travelers
            self.db.add(schedule)
            self.db.flush()

            self.audit_service.log_action(
                actor_type=LogActorType.user,
                actor_user_id=booking.user_id,
                action="tour_checkout_created",
                resource_type="booking",
                resource_id=booking.id,
                ip_address=normalize_ip(ip_address),
                user_agent=user_agent,
                metadata={
                    "tour_schedule_id": str(schedule.id),
                    "tour_id": str(schedule.tour_id),
                    "adult_count": payload.adult_count,
                    "child_count": payload.child_count,
                    "infant_count": payload.infant_count,
                    "total_travelers": total_travelers,
                    "total_price": str(total_price),
                    "idempotency_key": idempotency_key,
                },
            )

            payment = self._create_payment(
                booking=booking,
                payment_method=payment_method,
                idempotency_key=idempotency_key,
                ip_address=ip_address,
                user_agent=user_agent,
            )

            if user_email and user_full_name:
                self.outbox_service.enqueue_email(
                    handler="send_booking_created_email",
                    kwargs={
                        "to_email": user_email,
                        "full_name": user_full_name,
                        "booking_code": booking.booking_code,
                        "total_amount": str(booking.total_final_amount),
                        "currency": booking.currency,
                    },
                )

            self.outbox_service.enqueue_notification(
                handler="notify_booking_created",
                kwargs={
                    "user_id": str(booking.user_id),
                    "booking_id": str(booking.id),
                    "booking_code": booking.booking_code,
                },
            )

        self.commit_and_refresh(booking, payment)
        return booking, payment
