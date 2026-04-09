from app.models.enums import TourScheduleStatus, TourStatus, TravelerType
from app.models.tour import Tour, TourPriceRule, TourSchedule


def seed_catalog_tour(db_session):
    from datetime import date, timedelta

    tour = Tour(
        code="CONTENT-TOUR-001",
        name="Amalfi Coast Escape",
        destination="Amalfi Coast",
        description="Premium Amalfi itinerary",
        duration_days=6,
        duration_nights=5,
        meeting_point="Naples",
        tour_type="coastal",
        status=TourStatus.active,
    )
    db_session.add(tour)
    db_session.flush()

    schedule = TourSchedule(
        tour_id=tour.id,
        departure_date=date.today() + timedelta(days=14),
        return_date=date.today() + timedelta(days=19),
        capacity=10,
        available_slots=10,
        status=TourScheduleStatus.scheduled,
    )
    db_session.add(schedule)
    db_session.flush()

    db_session.add(
        TourPriceRule(
            tour_schedule_id=schedule.id,
            traveler_type=TravelerType.adult,
            price="1499.00",
            currency="USD",
        )
    )
    db_session.commit()


def test_list_public_destinations_uses_catalog_data(client, db_session):
    seed_catalog_tour(db_session)

    response = client.get("/api/v1/content/destinations?featured_only=true")

    assert response.status_code == 200
    items = response.json()
    assert any(item["name"] == "Amalfi Coast" for item in items)
    amalfi = next(item for item in items if item["name"] == "Amalfi Coast")
    assert amalfi["tourCount"] >= 1
    assert amalfi["startingPrice"] == 1499.0


def test_list_public_promotions_and_support_content(client):
    promotions_response = client.get("/api/v1/content/promotions?featured_only=true")
    topics_response = client.get("/api/v1/content/support/help-topics")
    faqs_response = client.get("/api/v1/content/support/faqs")

    assert promotions_response.status_code == 200
    assert topics_response.status_code == 200
    assert faqs_response.status_code == 200
    assert len(promotions_response.json()) >= 1
    assert len(topics_response.json()) >= 1
    assert len(faqs_response.json()) >= 1
