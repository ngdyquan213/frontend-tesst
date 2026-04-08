import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.security import get_password_hash
from app.models.booking import Booking, BookingItem
from app.models.enums import BookingItemType, BookingStatus, PaymentStatus, UserStatus
from app.models.flight import Airline, Airport, Flight
from app.models.user import User
from app.services.payment_gateway_service import PaymentGatewayService


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


def seed_booking(db_session, user_id: str, booking_code: str):
    airline = Airline(code=f"ST{booking_code[-2:]}", name="Stripe Airline")
    dep = Airport(code=f"SD{booking_code[-2:]}", name="Departure", city="A", country="VN")
    arr = Airport(code=f"SA{booking_code[-2:]}", name="Arrival", city="B", country="VN")
    db_session.add_all([airline, dep, arr])
    db_session.flush()

    flight = Flight(
        airline_id=airline.id,
        flight_number=f"ST{booking_code[-3:]}",
        departure_airport_id=dep.id,
        arrival_airport_id=arr.id,
        departure_time=datetime.now(timezone.utc) + timedelta(days=1),
        arrival_time=datetime.now(timezone.utc) + timedelta(days=1, hours=2),
        base_price=Decimal("1500000.00"),
        available_seats=10,
        status="scheduled",
    )
    db_session.add(flight)
    db_session.flush()

    booking = Booking(
        booking_code=booking_code,
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

    db_session.add(
        BookingItem(
            booking_id=booking.id,
            item_type=BookingItemType.flight,
            flight_id=flight.id,
            quantity=1,
            unit_price=Decimal("1500000.00"),
            total_price=Decimal("1500000.00"),
        )
    )
    db_session.commit()
    return booking


def test_initiate_payment_with_stripe_returns_gateway_payload(client, db_session, monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STRIPE_SECRET_KEY", "sk_test_demo")
    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_SECRET", "whsec_demo")
    monkeypatch.setattr(config_module.settings, "STRIPE_PUBLISHABLE_KEY", "pk_test_demo")

    def fake_stripe_request(self, *, method, path, data=None, idempotency_key=None):
        assert method == "POST"
        assert path == "/payment_intents"
        assert idempotency_key == "stripe-idem-001"
        assert data["currency"] == "vnd"
        return {
            "id": "pi_test_123",
            "client_secret": "pi_test_123_secret_456",
            "status": "requires_payment_method",
        }

    monkeypatch.setattr(PaymentGatewayService, "_stripe_request", fake_stripe_request)

    user, token = create_user_and_login(client, db_session, "stripe1@example.com", "stripe1")
    booking = seed_booking(db_session, str(user.id), "BK-STRIPE-001")

    resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "stripe"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "stripe-idem-001"},
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["gateway_payload"]["provider"] == "stripe"
    assert body["gateway_payload"]["payment_intent_id"] == "pi_test_123"
    assert body["gateway_payload"]["client_secret"] == "pi_test_123_secret_456"
    assert body["gateway_transaction_ref"] == "pi_test_123"


def test_parse_stripe_webhook_valid_signature(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_SECRET", "whsec_demo")
    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_TOLERANCE_SECONDS", 300)

    service = PaymentGatewayService()
    timestamp = 1_700_000_000
    monkeypatch.setattr(service, "_current_unix_timestamp", lambda: timestamp + 10)

    payload = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_live_001",
                "latest_charge": "ch_live_001",
                "amount_received": 1500000,
                "currency": "vnd",
                "metadata": {"gateway_order_ref": "PAY-BK-STRIPE-001-stripe-idem-001"},
            }
        },
    }
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    import hashlib
    import hmac

    signature = hmac.new(
        b"whsec_demo",
        f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    result = service.parse_stripe_webhook(
        raw_body=raw_body,
        signature_header=f"t={timestamp},v1={signature}",
    )

    assert result == {
        "gateway_name": "stripe",
        "gateway_order_ref": "PAY-BK-STRIPE-001-stripe-idem-001",
        "gateway_transaction_ref": "ch_live_001",
        "amount": "1500000.00",
        "currency": "VND",
        "status": "paid",
    }


def test_parse_stripe_webhook_failed_event_uses_amount_not_amount_received(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_SECRET", "whsec_demo")
    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_TOLERANCE_SECONDS", 300)

    service = PaymentGatewayService()
    timestamp = 1_700_000_100
    monkeypatch.setattr(service, "_current_unix_timestamp", lambda: timestamp + 10)

    payload = {
        "type": "payment_intent.payment_failed",
        "data": {
            "object": {
                "id": "pi_live_002",
                "latest_charge": "ch_live_002",
                "amount": 1500000,
                "amount_received": 0,
                "currency": "vnd",
                "metadata": {"gateway_order_ref": "PAY-BK-STRIPE-002-stripe-idem-002"},
            }
        },
    }
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    import hashlib
    import hmac

    signature = hmac.new(
        b"whsec_demo",
        f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    result = service.parse_stripe_webhook(
        raw_body=raw_body,
        signature_header=f"t={timestamp},v1={signature}",
    )

    assert result["amount"] == "1500000.00"
    assert result["status"] == "failed"


def test_parse_stripe_webhook_cancelled_event_uses_amount_not_amount_received(monkeypatch):
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_SECRET", "whsec_demo")
    monkeypatch.setattr(config_module.settings, "STRIPE_WEBHOOK_TOLERANCE_SECONDS", 300)

    service = PaymentGatewayService()
    timestamp = 1_700_000_200
    monkeypatch.setattr(service, "_current_unix_timestamp", lambda: timestamp + 10)

    payload = {
        "type": "payment_intent.canceled",
        "data": {
            "object": {
                "id": "pi_live_003",
                "amount": 1500000,
                "amount_received": 0,
                "currency": "vnd",
                "metadata": {"gateway_order_ref": "PAY-BK-STRIPE-003-stripe-idem-003"},
            }
        },
    }
    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    import hashlib
    import hmac

    signature = hmac.new(
        b"whsec_demo",
        f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    result = service.parse_stripe_webhook(
        raw_body=raw_body,
        signature_header=f"t={timestamp},v1={signature}",
    )

    assert result["amount"] == "1500000.00"
    assert result["status"] == "cancelled"


def test_stripe_callback_route_processes_verified_webhook(client, db_session, monkeypatch):
    user, token = create_user_and_login(client, db_session, "stripe2@example.com", "stripe2")
    booking = seed_booking(db_session, str(user.id), "BK-STRIPE-002")

    init_resp = client.post(
        "/api/v1/payments/initiate",
        json={"booking_id": str(booking.id), "payment_method": "vnpay"},
        headers={"Authorization": f"Bearer {token}", "Idempotency-Key": "stripe-callback-001"},
    )
    payment = init_resp.json()

    def fake_parse(self, *, raw_body: bytes, signature_header: str):
        assert signature_header == "t=demo,v1=demo"
        return {
            "gateway_name": "stripe",
            "gateway_order_ref": payment["gateway_order_ref"],
            "gateway_transaction_ref": "ch_live_002",
            "amount": "1500000.00",
            "currency": "VND",
            "status": "paid",
        }

    monkeypatch.setattr(PaymentGatewayService, "parse_stripe_webhook", fake_parse)

    callback_resp = client.post(
        "/api/v1/payments/callback/stripe",
        headers={
            "Stripe-Signature": "t=demo,v1=demo",
            "Content-Type": "application/json",
        },
        content=b'{"id":"evt_live_001"}',
    )

    assert callback_resp.status_code == 200
    assert callback_resp.json()["status"] == "paid"
