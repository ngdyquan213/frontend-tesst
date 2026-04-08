from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.orm import sessionmaker

from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentMethod,
    PaymentStatus,
    TourScheduleStatus,
    TourStatus,
    TravelerType,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.payment import Payment
from app.models.tour import Tour, TourPriceRule, TourSchedule
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.flight_repository import FlightRepository
from app.repositories.hotel_repository import HotelRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.tour_repository import TourRepository
from app.schemas.booking import BookingCancelRequest
from app.services.audit_service import AuditService
from app.services.booking_cancellation_domain_service import BookingCancellationDomainService
from app.services.booking_cancellation_service import BookingCancellationService
from app.services.booking_inventory_service import BookingInventoryService
from app.workers.email_worker import EmailWorker


def create_user_and_login(client, db_session, email: str, username: str):
    user = User(
        email=email,
        username=username,
        full_name=username,
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(user)
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123"},
    )
    assert resp.status_code == 200
    return user, resp.json()["access_token"]


def seed_flight_booking_with_payment(db_session, user_id: str):
    suffix = uuid4().hex[:6].upper()
    airline = Airline(code=f"R{suffix[:2]}", name="Refund Carrier")
    dep = Airport(code=f"D{suffix[:3]}", name="A", city="A", country="VN")
    arr = Airport(code=f"A{suffix[:3]}", name="B", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number=f"RC{suffix[:4]}",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1200000.00"),
        available_seats=10,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.flush()

    booking = Booking(
        booking_code=f"BK-CANCEL-{suffix}",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1200000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1200000.00"),
        currency="VND",
        payment_status=PaymentStatus.paid,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    db_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=Decimal("1200000.00"),
            total_price=Decimal("1200000.00"),
        )
    )
    db_session.flush()

    payment = Payment(
        booking_id=booking.id,
        initiated_by=user_id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.paid,
        amount=Decimal("1200000.00"),
        currency="VND",
        gateway_order_ref=f"ORDER-CANCEL-{suffix}",
        gateway_transaction_ref=f"TXN-CANCEL-{suffix}",
        paid_at=datetime.now(timezone.utc),
    )
    db_session.add(payment)
    db_session.commit()

    return booking


def seed_tour_booking_pending_payment(db_session, user_id: str):
    tour = Tour(
        code="CANCEL-TOUR-001",
        name="Cancel Tour",
        destination="Da Nang",
        description="Cancellation test tour",
        duration_days=3,
        duration_nights=2,
        meeting_point="Airport",
        tour_type="domestic",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.flush()

    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=datetime.now(timezone.utc).date() + timedelta(days=7),
        return_date=datetime.now(timezone.utc).date() + timedelta(days=9),
        capacity=10,
        available_slots=8,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add(schedule)
    db_session.flush()

    db_session.add_all(
        [
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.adult,
                price=Decimal("3000000.00"),
                currency="VND",
            ),
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.child,
                price=Decimal("2000000.00"),
                currency="VND",
            ),
        ]
    )
    db_session.flush()

    booking = Booking(
        booking_code="BK-CANCEL-TOUR",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("3000000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("3000000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    db_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.tour,
            tour_schedule_id=schedule.id,
            quantity=2,
            unit_price=Decimal("1500000.00"),
            total_price=Decimal("3000000.00"),
            metadata_json={"adult_count": 2, "child_count": 0, "infant_count": 0},
        )
    )
    db_session.flush()

    payment = Payment(
        booking_id=booking.id,
        initiated_by=user_id,
        payment_method=PaymentMethod.vnpay,
        status=PaymentStatus.pending,
        amount=Decimal("3000000.00"),
        currency="VND",
        gateway_order_ref="ORDER-CANCEL-TOUR-001",
    )
    db_session.add(payment)
    db_session.commit()

    return booking, schedule


def test_cancel_paid_flight_booking_creates_refund(client, db_session):
    user, token = create_user_and_login(client, db_session, "cancel1@example.com", "cancel1")
    booking = seed_flight_booking_with_payment(db_session, str(user.id))

    resp = client.post(
        f"/api/v1/bookings/{booking.id}/cancel",
        json={"reason": "Change of plan"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "cancelled"
    assert body["payment_status"] == "refunded"
    assert body["refund_amount"] == "1200000.00"
    assert body["refund_status"] == "processed"


def test_cancel_pending_tour_booking_cancels_payment_no_refund(client, db_session):
    user, token = create_user_and_login(client, db_session, "cancel2@example.com", "cancel2")
    booking, _ = seed_tour_booking_pending_payment(db_session, str(user.id))

    resp = client.post(
        f"/api/v1/bookings/{booking.id}/cancel",
        json={"reason": "Cannot join"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "cancelled"
    assert body["payment_status"] == "cancelled"
    assert body["refund_amount"] == "0"


def test_cancel_booking_uses_locked_booking_lookup(db_engine, monkeypatch):
    session_local = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    seed_session = session_local()
    user = User(
        email="cancel-lock@example.com",
        username="cancel_lock",
        full_name="Cancel Lock",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    seed_session.add(user)
    seed_session.commit()

    booking = seed_flight_booking_with_payment(seed_session, str(user.id))
    booking_id = str(booking.id)
    user_id = str(user.id)
    seed_session.close()

    write_session = session_local()
    booking_repo = BookingRepository(write_session)
    original_locked_lookup = booking_repo.get_by_id_and_user_id_for_update
    locked_calls: list[tuple[str, str]] = []

    def fail_non_locked_lookup(*args, **kwargs):
        raise AssertionError("cancel flow must use locked booking lookup")

    def track_locked_lookup(booking_id_value: str, user_id_value: str):
        locked_calls.append((booking_id_value, user_id_value))
        return original_locked_lookup(booking_id_value, user_id_value)

    monkeypatch.setattr(booking_repo, "get_by_id_and_user_id", fail_non_locked_lookup)
    monkeypatch.setattr(booking_repo, "get_by_id_and_user_id_for_update", track_locked_lookup)

    service = BookingCancellationService(
        db=write_session,
        booking_repo=booking_repo,
        payment_repo=PaymentRepository(write_session),
        audit_service=AuditService(AuditRepository(write_session)),
        email_worker=EmailWorker(),
        inventory_service=BookingInventoryService(
            flight_repo=FlightRepository(write_session),
            hotel_repo=HotelRepository(write_session),
            tour_repo=TourRepository(write_session),
        ),
        domain_service=BookingCancellationDomainService(),
    )

    try:
        booking, payment, refund = service.cancel_booking(
            booking_id=booking_id,
            user_id=user_id,
            payload=BookingCancelRequest(reason="Lock the row"),
        )
    finally:
        write_session.close()

    assert str(booking.id) == booking_id
    assert payment is not None
    assert refund is not None
    assert locked_calls == [(booking_id, user_id)]


def test_cancel_booking_uses_locked_payment_lookup(db_engine, monkeypatch):
    session_local = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    seed_session = session_local()
    user = User(
        email="cancel-payment-lock@example.com",
        username="cancel_payment_lock",
        full_name="Cancel Payment Lock",
        password_hash=get_password_hash("Password123"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    seed_session.add(user)
    seed_session.commit()

    booking = seed_flight_booking_with_payment(seed_session, str(user.id))
    booking_id = str(booking.id)
    user_id = str(user.id)
    seed_session.close()

    write_session = session_local()
    booking_repo = BookingRepository(write_session)
    payment_repo = PaymentRepository(write_session)
    locked_calls: list[str] = []
    original_locked_lookup = payment_repo.get_latest_by_booking_id_for_update

    def fail_non_locked_lookup(*args, **kwargs):
        raise AssertionError("cancel flow must use locked payment lookup")

    def track_locked_lookup(booking_id_value: str):
        locked_calls.append(booking_id_value)
        return original_locked_lookup(booking_id_value)

    monkeypatch.setattr(payment_repo, "get_latest_by_booking_id", fail_non_locked_lookup)
    monkeypatch.setattr(payment_repo, "get_latest_by_booking_id_for_update", track_locked_lookup)

    service = BookingCancellationService(
        db=write_session,
        booking_repo=booking_repo,
        payment_repo=payment_repo,
        audit_service=AuditService(AuditRepository(write_session)),
        email_worker=EmailWorker(),
        inventory_service=BookingInventoryService(
            flight_repo=FlightRepository(write_session),
            hotel_repo=HotelRepository(write_session),
            tour_repo=TourRepository(write_session),
        ),
        domain_service=BookingCancellationDomainService(),
    )

    try:
        booking, payment, refund = service.cancel_booking(
            booking_id=booking_id,
            user_id=user_id,
            payload=BookingCancelRequest(reason="Lock payment row"),
        )
    finally:
        write_session.close()

    assert str(booking.id) == booking_id
    assert payment is not None
    assert refund is not None
    assert locked_calls == [booking_id]
