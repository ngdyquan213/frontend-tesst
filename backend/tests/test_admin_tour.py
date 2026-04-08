from datetime import date, timedelta

from app.core.security import get_password_hash
from app.models.enums import TourStatus, UserStatus
from app.models.role import Role, UserRole
from app.models.tour import Tour
from app.models.user import User


def create_admin_and_login(client, db_session):
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin", description="Administrator")
        db_session.add(admin_role)
        db_session.flush()

    admin_user = User(
        email="admin-tour@example.com",
        username="admin_tour",
        full_name="Admin Tour",
        password_hash=get_password_hash("Admin12345"),
        status=UserStatus.active,
        email_verified=True,
        phone_verified=False,
        failed_login_count=0,
    )
    db_session.add(admin_user)
    db_session.flush()

    db_session.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin-tour@example.com", "password": "Admin12345"},
    )
    assert resp.status_code == 200
    return admin_user, resp.json()["access_token"]


def create_normal_user_and_login(client, db_session):
    user = User(
        email="normal-tour@example.com",
        username="normal_tour",
        full_name="Normal Tour",
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
        json={"email": "normal-tour@example.com", "password": "Password123"},
    )
    assert resp.status_code == 200
    return user, resp.json()["access_token"]


def seed_tour(db_session):
    tour = Tour(
        code="ADMIN-TOUR-001",
        name="Admin Tour Seed",
        destination="Da Nang",
        description="Seeded admin tour",
        duration_days=3,
        duration_nights=2,
        meeting_point="Airport",
        tour_type="domestic",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.commit()
    return tour


def test_admin_can_create_tour(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)

    resp = client.post(
        "/api/v1/admin/tours",
        json={
            "code": "HN-HL-3N2D",
            "name": "Ha Noi - Ha Long 3N2D",
            "destination": "Ha Long",
            "description": "Cruise and sightseeing",
            "duration_days": 3,
            "duration_nights": 2,
            "meeting_point": "Ha Noi Old Quarter",
            "tour_type": "domestic",
            "status": "active",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["code"] == "HN-HL-3N2D"
    assert body["status"] == "active"

    db_session.expire_all()
    saved_tour = db_session.query(Tour).filter(Tour.code == "HN-HL-3N2D").first()
    assert saved_tour is not None
    assert saved_tour.destination == "Ha Long"


def test_admin_can_update_tour(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    tour = seed_tour(db_session)

    resp = client.put(
        f"/api/v1/admin/tours/{tour.id}",
        json={
            "name": "Updated Admin Tour",
            "destination": "Nha Trang",
            "duration_days": 4,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Updated Admin Tour"
    assert body["destination"] == "Nha Trang"
    assert body["duration_days"] == 4


def test_admin_can_deactivate_tour(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    tour = seed_tour(db_session)

    resp = client.post(
        f"/api/v1/admin/tours/{tour.id}/deactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == str(tour.id)
    assert body["status"] == "inactive"


def test_admin_can_create_schedule(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    tour = seed_tour(db_session)

    resp = client.post(
        f"/api/v1/admin/tours/{tour.id}/schedules",
        json={
            "departure_date": (date.today() + timedelta(days=10)).isoformat(),
            "return_date": (date.today() + timedelta(days=12)).isoformat(),
            "capacity": 20,
            "available_slots": 20,
            "status": "scheduled",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["tour_id"] == str(tour.id)
    assert body["capacity"] == 20
    assert body["status"] == "scheduled"

    db_session.expire_all()
    saved_schedule = db_session.query(Tour).filter(Tour.id == tour.id).first().schedules[0]
    assert saved_schedule.available_slots == 20


def test_admin_can_update_schedule(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    tour = seed_tour(db_session)

    create_resp = client.post(
        f"/api/v1/admin/tours/{tour.id}/schedules",
        json={
            "departure_date": (date.today() + timedelta(days=10)).isoformat(),
            "return_date": (date.today() + timedelta(days=12)).isoformat(),
            "capacity": 20,
            "available_slots": 20,
            "status": "scheduled",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_resp.status_code == 201
    schedule_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/admin/tour-schedules/{schedule_id}",
        json={
            "capacity": 25,
            "available_slots": 18,
            "status": "scheduled",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert update_resp.status_code == 200
    body = update_resp.json()
    assert body["capacity"] == 25
    assert body["available_slots"] == 18


def test_admin_can_deactivate_schedule(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    tour = seed_tour(db_session)

    create_resp = client.post(
        f"/api/v1/admin/tours/{tour.id}/schedules",
        json={
            "departure_date": (date.today() + timedelta(days=10)).isoformat(),
            "return_date": (date.today() + timedelta(days=12)).isoformat(),
            "capacity": 20,
            "available_slots": 20,
            "status": "scheduled",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_resp.status_code == 201
    schedule_id = create_resp.json()["id"]

    deactivate_resp = client.post(
        f"/api/v1/admin/tour-schedules/{schedule_id}/deactivate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert deactivate_resp.status_code == 200
    body = deactivate_resp.json()
    assert body["status"] == "closed"


def test_admin_can_create_tour_price_rule(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    tour = seed_tour(db_session)

    schedule_resp = client.post(
        f"/api/v1/admin/tours/{tour.id}/schedules",
        json={
            "departure_date": (date.today() + timedelta(days=10)).isoformat(),
            "return_date": (date.today() + timedelta(days=12)).isoformat(),
            "capacity": 20,
            "available_slots": 20,
            "status": "scheduled",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert schedule_resp.status_code == 201
    schedule_id = schedule_resp.json()["id"]

    price_resp = client.post(
        f"/api/v1/admin/tour-schedules/{schedule_id}/price-rules",
        json={
            "traveler_type": "adult",
            "price": 3990000,
            "currency": "VND",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert price_resp.status_code == 201
    body = price_resp.json()
    assert body["tour_schedule_id"] == schedule_id
    assert body["traveler_type"] == "adult"
    assert body["currency"] == "VND"


def test_non_admin_cannot_create_tour(client, db_session):
    _, user_token = create_normal_user_and_login(client, db_session)

    resp = client.post(
        "/api/v1/admin/tours",
        json={
            "code": "DENY-TOUR-001",
            "name": "Denied Tour",
            "destination": "Hue",
            "description": "Should fail",
            "duration_days": 3,
            "duration_nights": 2,
            "meeting_point": "Center",
            "tour_type": "domestic",
            "status": "active",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )

    assert resp.status_code == 403
    assert resp.json()["detail"] == "Admin access required"


def test_non_admin_cannot_manage_schedule(client, db_session):
    _, admin_token = create_admin_and_login(client, db_session)
    _, user_token = create_normal_user_and_login(client, db_session)
    tour = seed_tour(db_session)

    create_resp = client.post(
        f"/api/v1/admin/tours/{tour.id}/schedules",
        json={
            "departure_date": (date.today() + timedelta(days=10)).isoformat(),
            "return_date": (date.today() + timedelta(days=12)).isoformat(),
            "capacity": 20,
            "available_slots": 20,
            "status": "scheduled",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_resp.status_code == 201
    schedule_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/admin/tour-schedules/{schedule_id}",
        json={"capacity": 30},
        headers={"Authorization": f"Bearer {user_token}"},
    )

    assert update_resp.status_code == 403
    assert update_resp.json()["detail"] == "Admin access required"
