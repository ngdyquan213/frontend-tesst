import pytest
from sqlalchemy import text

pytestmark = pytest.mark.postgres


def test_postgres_connection_works(postgres_healthcheck):
    assert postgres_healthcheck == 1


def test_postgres_can_execute_basic_query(db_session_pg):
    result = db_session_pg.execute(text("SELECT current_database()")).scalar()
    assert result is not None


def test_health_endpoint_with_postgres(client_pg):
    resp = client_pg.get("/health")
    assert resp.status_code == 200
