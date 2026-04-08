from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.utils.request_context import get_client_ip


def create_request_ip_test_app() -> FastAPI:
    app = FastAPI()

    @app.get("/client-ip")
    def client_ip(request: Request):
        return {"client_ip": get_client_ip(request)}

    return app


def test_get_client_ip_ignores_forwarded_headers_from_untrusted_peer():
    app = create_request_ip_test_app()

    with TestClient(app) as client:
        response = client.get(
            "/client-ip",
            headers={"x-forwarded-for": "203.0.113.10"},
        )

    assert response.status_code == 200
    assert response.json()["client_ip"] == "testclient"


def test_get_client_ip_uses_forwarded_headers_from_trusted_proxy():
    app = create_request_ip_test_app()

    with TestClient(app, client=("127.0.0.1", 50000)) as client:
        response = client.get(
            "/client-ip",
            headers={
                "x-forwarded-for": "203.0.113.10, 10.0.0.5",
                "x-real-ip": "203.0.113.11",
            },
        )

    assert response.status_code == 200
    assert response.json()["client_ip"] == "203.0.113.10"


def test_get_client_ip_rejects_spoofed_first_hop_from_trusted_proxy():
    app = create_request_ip_test_app()

    with TestClient(app, client=("127.0.0.1", 50000)) as client:
        response = client.get(
            "/client-ip",
            headers={
                "x-forwarded-for": "203.0.113.10, 198.51.100.24",
                "x-real-ip": "198.51.100.24",
            },
        )

    assert response.status_code == 200
    assert response.json()["client_ip"] == "198.51.100.24"


def test_get_client_ip_prefers_forwarded_header_with_ipv6_from_trusted_proxy():
    app = create_request_ip_test_app()

    with TestClient(app, client=("127.0.0.1", 50000)) as client:
        response = client.get(
            "/client-ip",
            headers={"forwarded": 'for="[2001:db8::10]:8443";proto=https, for=10.0.0.5'},
        )

    assert response.status_code == 200
    assert response.json()["client_ip"] == "2001:db8::10"


def test_get_client_ip_skips_trusted_proxy_hops_in_forwarded_header():
    app = create_request_ip_test_app()

    with TestClient(app, client=("127.0.0.1", 50000)) as client:
        response = client.get(
            "/client-ip",
            headers={
                "forwarded": 'for=203.0.113.10;proto=https, for=10.0.0.5;proto=https'
            },
        )

    assert response.status_code == 200
    assert response.json()["client_ip"] == "203.0.113.10"


def test_get_client_ip_falls_back_to_x_real_ip_for_trusted_proxy():
    app = create_request_ip_test_app()

    with TestClient(app, client=("127.0.0.1", 50000)) as client:
        response = client.get(
            "/client-ip",
            headers={"x-real-ip": "198.51.100.24"},
        )

    assert response.status_code == 200
    assert response.json()["client_ip"] == "198.51.100.24"
