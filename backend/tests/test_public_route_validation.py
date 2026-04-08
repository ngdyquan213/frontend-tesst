def test_flight_detail_rejects_invalid_uuid(client):
    response = client.get("/api/v1/flights/not-a-uuid")

    assert response.status_code == 422


def test_hotel_detail_rejects_invalid_uuid(client):
    response = client.get("/api/v1/hotels/not-a-uuid")

    assert response.status_code == 422


def test_tour_detail_rejects_invalid_uuid(client):
    response = client.get("/api/v1/tours/not-a-uuid")

    assert response.status_code == 422
