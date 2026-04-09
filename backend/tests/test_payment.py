from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.config import settings
from app.core.security import build_payment_callback_signature, get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import (
    BookingItemType,
    BookingStatus,
    PaymentStatus,
    TourScheduleStatus,
    TourStatus,
    TravelerType,
    UserStatus,
)
from app.models.flight import Airline, Airport, Flight
from app.models.tour import Tour, TourPriceRule, TourSchedule
from app.models.user import User


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
    token = resp.json()["access_token"]
    return user, token


def seed_flight(db_session):
    airline = Airline(code="TP", name="Test Payment Airline")
    dep = Airport(code="TPC", name="Test Departure", city="A", country="VN")
    arr = Airport(code="TPD", name="Test Arrival", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number="TP100",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1500000.00"),
        available_seats=10,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.commit()
    return flight


def seed_booking_for_user(db_session, user_id: str):
    flight = seed_flight(db_session)

    booking = Booking(
        booking_code="BK-TESTPAY001",
        user_id=user_id,
        status=BookingStatus.pending,
        total_base_amount=Decimal("1500000.00"),
        total_discount_amount=Decimal("0.00"),
        total_final_amount=Decimal("1500000.00"),
        currency="VND",
        payment_status=PaymentStatus.pending,
        booked_at=datetime.now(timezone.utc),
    )
    db_session.add(booking)
    db_session.flush()

    item = BookingItem(
        booking_id=booking.id,
        item_type=BookingItemType.flight,
        flight_id=flight.id,
        quantity=1,
        unit_price=Decimal("1500000.00"),
        total_price=Decimal("1500000.00"),
    )
    db_session.add(item)
    db_session.commit()

    return booking


def seed_tour_schedule(db_session):
    tour = Tour(
        code="TEST-CHECKOUT-001",
        name="Checkout Tour",
        destination="Hoi An",
        description="Checkout Tour Description",
        duration_days=4,
        duration_nights=3,
        meeting_point="Old Town",
        tour_type="curated",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.flush()

    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=datetime.now(timezone.utc).date() + timedelta(days=7),
        return_date=datetime.now(timezone.utc).date() + timedelta(days=10),
        capacity=12,
        available_slots=12,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add(schedule)
    db_session.flush()

    db_session.add_all(
        [
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.adult,
                price="3000000.00",
                currency="VND",
            ),
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.child,
                price="1500000.00",
                currency="VND",
            ),
            TourPriceRule(
                tour_schedule_id=schedule.id,
                traveler_type=TravelerType.infant,
                price="500000.00",
                currency="VND",
            ),
        ]
    )
    db_session.commit()
    return schedule


def test_initiate_payment_success(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "payment1@example.com",
        "payment_user_1",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "init-payment-001",
        },
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["booking_id"] == str(booking.id)
    assert body["payment_method"] == "vnpay"
    assert body["status"] == "pending"
    assert body["amount"] == "1500000.00"


def test_list_payment_methods_hides_stripe_when_gateway_is_not_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "")
    monkeypatch.setattr(settings, "ENABLED_PAYMENT_METHODS", "manual,vnpay,momo,stripe")

    resp = client.get("/api/v1/payments/methods")

    assert resp.status_code == 200
    body = resp.json()
    assert [item["id"] for item in body] == ["manual", "vnpay", "momo"]


def test_list_payment_methods_includes_stripe_when_gateway_is_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_configured")
    monkeypatch.setattr(settings, "ENABLED_PAYMENT_METHODS", "manual,vnpay,momo,stripe")

    resp = client.get("/api/v1/payments/methods")

    assert resp.status_code == 200
    body = resp.json()
    assert [item["id"] for item in body] == ["manual", "vnpay", "momo", "stripe"]


def test_list_payment_methods_uses_configured_production_safe_gateways(client, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ALLOW_PAYMENT_SIMULATION", False)
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_live_configured")
    monkeypatch.setattr(settings, "ENABLED_PAYMENT_METHODS", "manual,stripe,vnpay,momo")

    resp = client.get("/api/v1/payments/methods")

    assert resp.status_code == 200
    body = resp.json()
    assert [item["id"] for item in body] == ["manual", "stripe"]


def test_initiate_payment_rejects_simulated_gateway_in_production_mode(
    client,
    db_session,
    monkeypatch,
):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ALLOW_PAYMENT_SIMULATION", False)
    monkeypatch.setattr(settings, "ENABLED_PAYMENT_METHODS", "manual,stripe")

    user, token = create_user_and_login(
        client,
        db_session,
        "payment-production@example.com",
        "payment_production_user",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "prod-payment-001",
        },
    )

    assert resp.status_code == 400
    assert resp.json()["message"] == "Payment method is not available in this environment"


def test_payment_idempotency_returns_same_payment(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "payment2@example.com",
        "payment_user_2",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    headers = {
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": "idem-payment-001",
    }

    payload = {
        "booking_id": str(booking.id),
        "payment_method": "vnpay",
    }

    resp1 = client.post("/api/v1/payments/initiate", json=payload, headers=headers)
    resp2 = client.post("/api/v1/payments/initiate", json=payload, headers=headers)

    assert resp1.status_code == 201
    assert resp2.status_code == 201

    body1 = resp1.json()
    body2 = resp2.json()

    assert body1["id"] == body2["id"]
    assert body1["gateway_order_ref"] == body2["gateway_order_ref"]


def test_payment_idempotency_rejects_different_payment_method(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "payment-idem-mismatch@example.com",
        "payment_idem_mismatch",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    headers = {
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": "idem-payment-mismatch-001",
    }

    first_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers=headers,
    )
    second_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "momo",
        },
        headers=headers,
    )

    assert first_resp.status_code == 201
    assert second_resp.status_code == 409
    assert second_resp.json()["message"] == (
        "Idempotency key was already used with a different payment method"
    )


def test_tour_checkout_creates_booking_and_payment_atomically(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "tour-checkout@example.com",
        "tour_checkout_user",
    )
    schedule = seed_tour_schedule(db_session)

    headers = {
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": "tour-checkout-001",
    }
    payload = {
        "tour_schedule_id": str(schedule.id),
        "adult_count": 2,
        "child_count": 1,
        "infant_count": 0,
        "payment_method": "vnpay",
    }

    response = client.post("/api/v1/payments/checkout/tours", json=payload, headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["booking"]["user_id"] == str(user.id)
    assert body["booking"]["schedule_id"] == str(schedule.id)
    assert body["booking"]["total_final_amount"] == "7500000.00"
    assert body["payment"]["booking_id"] == body["booking"]["id"]
    assert body["payment"]["payment_method"] == "vnpay"
    assert body["payment"]["status"] == "pending"

    db_session.refresh(schedule)
    assert schedule.available_slots == 9


def test_tour_checkout_reuses_existing_booking_and_payment_for_same_idempotency_key(
    client, db_session
):
    _, token = create_user_and_login(
        client,
        db_session,
        "tour-checkout-reuse@example.com",
        "tour_checkout_reuse_user",
    )
    schedule = seed_tour_schedule(db_session)

    headers = {
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": "tour-checkout-reuse-001",
    }
    payload = {
        "tour_schedule_id": str(schedule.id),
        "adult_count": 1,
        "child_count": 1,
        "infant_count": 0,
        "payment_method": "vnpay",
    }

    first_response = client.post("/api/v1/payments/checkout/tours", json=payload, headers=headers)
    second_response = client.post("/api/v1/payments/checkout/tours", json=payload, headers=headers)

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_response.json()["booking"]["id"] == second_response.json()["booking"]["id"]
    assert first_response.json()["payment"]["id"] == second_response.json()["payment"]["id"]

    db_session.refresh(schedule)
    assert schedule.available_slots == 10


def test_tour_checkout_rejects_changed_payload_for_same_idempotency_key(client, db_session):
    _, token = create_user_and_login(
        client,
        db_session,
        "tour-checkout-conflict@example.com",
        "tour_checkout_conflict_user",
    )
    schedule = seed_tour_schedule(db_session)

    headers = {
        "Authorization": f"Bearer {token}",
        "Idempotency-Key": "tour-checkout-conflict-001",
    }
    first_response = client.post(
        "/api/v1/payments/checkout/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 1,
            "child_count": 0,
            "infant_count": 0,
            "payment_method": "vnpay",
        },
        headers=headers,
    )
    second_response = client.post(
        "/api/v1/payments/checkout/tours",
        json={
            "tour_schedule_id": str(schedule.id),
            "adult_count": 2,
            "child_count": 0,
            "infant_count": 0,
            "payment_method": "vnpay",
        },
        headers=headers,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["message"] == (
        "Idempotency key was already used with different traveler counts"
    )


def test_payment_initiation_rejects_idempotency_key_that_would_overflow_gateway_reference(
    client, db_session
):
    user, token = create_user_and_login(
        client,
        db_session,
        "payment-idem-long@example.com",
        "payment_idem_long",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    response = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "vnpay",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "x" * 256,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Idempotency key is too long"


def test_simulate_success_updates_payment_and_booking(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_PAYMENT_SIMULATION", True)

    user, token = create_user_and_login(
        client,
        db_session,
        "payment3@example.com",
        "payment_user_3",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    initiate_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "momo",
        },
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "idem-payment-001"},
    )
    assert initiate_resp.status_code == 201

    payment_id = initiate_resp.json()["id"]

    success_resp = client.post(
        f"/api/v1/payments/{payment_id}/simulate-success",
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "idem-payment-001"},
    )
    assert success_resp.status_code == 200

    success_body = success_resp.json()
    assert success_body["status"] == "paid"
    assert success_body["gateway_transaction_ref"] is not None
    assert success_body["paid_at"] is not None

    status_resp = client.get(
        f"/api/v1/payments/booking/{booking.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_resp.status_code == 200
    status_body = status_resp.json()

    assert status_body["booking_id"] == str(booking.id)
    assert status_body["booking_payment_status"] == "paid"
    assert status_body["payment"] is not None
    assert status_body["payment"]["status"] == "paid"


def test_simulate_success_is_disabled_by_default(client, db_session):
    user, token = create_user_and_login(
        client,
        db_session,
        "payment-sim-off@example.com",
        "payment_sim_off",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    initiate_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "momo",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "idem-payment-sim-off",
        },
    )
    assert initiate_resp.status_code == 201

    payment_id = initiate_resp.json()["id"]

    disabled_resp = client.post(
        f"/api/v1/payments/{payment_id}/simulate-success",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert disabled_resp.status_code == 404
    assert disabled_resp.json()["error_code"] == "NOT_FOUND"


def test_simulate_success_rejects_non_pending_payment(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_PAYMENT_SIMULATION", True)

    user, token = create_user_and_login(
        client,
        db_session,
        "payment-sim-guard@example.com",
        "payment_sim_guard",
    )
    booking = seed_booking_for_user(db_session, str(user.id))

    initiate_resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "momo",
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "idem-payment-sim-guard",
        },
    )
    assert initiate_resp.status_code == 201

    payment = initiate_resp.json()
    callback_payload = {
        "timestamp": int(datetime.now(timezone.utc).timestamp()),
        "gateway_name": "momo",
        "gateway_order_ref": payment["gateway_order_ref"],
        "gateway_transaction_ref": "TXN-SIM-GUARD-001",
        "amount": "1500000.00",
        "currency": "VND",
        "status": "failed",
    }
    callback_payload["signature"] = build_payment_callback_signature(**callback_payload)

    callback_resp = client.post("/api/v1/payments/callback", json=callback_payload)
    assert callback_resp.status_code == 200
    assert callback_resp.json()["status"] == "failed"

    simulate_resp = client.post(
        f"/api/v1/payments/{payment['id']}/simulate-success",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert simulate_resp.status_code == 409
    assert simulate_resp.json()["message"] == "Only pending payments can be simulated as successful"


def test_user_cannot_initiate_payment_for_other_users_booking(client, db_session):
    owner, owner_token = create_user_and_login(
        client,
        db_session,
        "payment4-owner@example.com",
        "payment_owner",
    )
    attacker, attacker_token = create_user_and_login(
        client,
        db_session,
        "payment4-attacker@example.com",
        "payment_attacker",
    )

    booking = seed_booking_for_user(db_session, str(owner.id))

    resp = client.post(
        "/api/v1/payments/initiate",
        json={
            "booking_id": str(booking.id),
            "payment_method": "stripe",
        },
        headers={
            "Authorization": f"Bearer {attacker_token}",
            "Idempotency-Key": "idem-payment-001",
        },
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Booking not found"
