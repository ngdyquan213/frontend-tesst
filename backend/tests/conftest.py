import os
import time
from collections.abc import Generator
from importlib import import_module

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, sessionmaker

DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
ADMIN_DB_NAME = os.getenv("POSTGRES_ADMIN_DB") or "secure_travel_booking"
TEST_DB_NAME = os.getenv("TEST_DB_NAME", f"secure_travel_booking_test_{os.getpid()}")

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{TEST_DB_NAME}",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

database_module = import_module("app.core.database")
redis_module = import_module("app.core.redis")
rate_limit_module = import_module("app.middleware.rate_limit_middleware")
startup_module = import_module("app.core.startup")
factory_module = import_module("app.workers.factory")
main_module = import_module("app.main")
run_migrations = import_module("tests.alembic_utils").run_migrations

os.environ.pop("DATABASE_URL", None)

pytest_plugins = ("tests.conftest_postgres",)
get_db = database_module.get_db
app = main_module.app

MINIMAL_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n"
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] "
    b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\n"
    b"endobj\n"
    b"4 0 obj\n<< /Length 37 >>\nstream\n"
    b"BT /F1 18 Tf 50 120 Td (Test PDF) Tj ET\n"
    b"endstream\nendobj\n"
    b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
    b"xref\n0 6\n"
    b"0000000000 65535 f \n"
    b"0000000009 00000 n \n"
    b"0000000058 00000 n \n"
    b"0000000115 00000 n \n"
    b"0000000241 00000 n \n"
    b"0000000328 00000 n \n"
    b"trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n398\n%%EOF\n"
)


class InMemoryRedis:
    def __init__(self) -> None:
        self._store: dict[str, int] = {}
        self._expirations: dict[str, float] = {}

    def _cleanup(self) -> None:
        now = time.time()
        expired = [key for key, expiry in self._expirations.items() if expiry <= now]
        for key in expired:
            self._store.pop(key, None)
            self._expirations.pop(key, None)

    def incr(self, key: str) -> int:
        self._cleanup()
        value = self._store.get(key, 0) + 1
        self._store[key] = value
        return value

    def expire(self, key: str, seconds: int) -> bool:
        self._cleanup()
        if key not in self._store:
            return False
        self._expirations[key] = time.time() + max(seconds, 0)
        return True

    def ttl(self, key: str) -> int:
        self._cleanup()
        expiry = self._expirations.get(key)
        if expiry is None:
            return -1 if key in self._store else -2
        return max(int(expiry - time.time()), 0)

    def scan_iter(self, match: str | None = None):
        self._cleanup()
        if not match or match == "*":
            yield from list(self._store.keys())
            return

        if match.endswith("*"):
            prefix = match[:-1]
            for key in list(self._store.keys()):
                if key.startswith(prefix):
                    yield key
            return

        if match in self._store:
            yield match

    def delete(self, *keys: str) -> int:
        deleted = 0
        for key in keys:
            if key in self._store:
                deleted += 1
            self._store.pop(key, None)
            self._expirations.pop(key, None)
        return deleted

    def ping(self) -> bool:
        return True

    def publish(self, channel: str, payload: str) -> int:
        self._cleanup()
        return 1


def recreate_test_database() -> None:
    admin_url = URL.create(
        drivername="postgresql+psycopg2",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=ADMIN_DB_NAME,
    )

    admin_engine = create_engine(
        admin_url,
        isolation_level="AUTOCOMMIT",
        connect_args={"connect_timeout": 2},
    )
    with admin_engine.connect() as conn:
        conn.execute(
            text(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = :name AND pid <> pg_backend_pid()
                """
            ),
            {"name": TEST_DB_NAME},
        )
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}" TEMPLATE template0'))

    admin_engine.dispose()


def _postgres_connect_args() -> dict[str, int]:
    if TEST_DATABASE_URL.startswith("postgresql"):
        return {"connect_timeout": 2}
    return {}


@pytest.fixture(scope="session")
def db_engine():
    try:
        recreate_test_database()
    except Exception:
        pytest.skip(
            "PostgreSQL is not available for integration tests. "
            "Start infra/docker/docker-compose.test.yml and rerun pytest."
        )

    engine = create_engine(
        TEST_DATABASE_URL,
        pool_pre_ping=True,
        connect_args=_postgres_connect_args(),
    )
    run_migrations(TEST_DATABASE_URL)

    yield engine

    engine.dispose()


@pytest.fixture()
def db_session(db_engine) -> Generator[Session, None, None]:
    connection = db_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=connection,
        join_transaction_mode="create_savepoint",
    )
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()


@pytest.fixture(autouse=True)
def configure_test_redis(monkeypatch):
    client = redis_module.redis_client

    try:
        client.ping()
        active_client = client
    except Exception:
        active_client = InMemoryRedis()
        monkeypatch.setattr(redis_module, "redis_client", active_client)
        monkeypatch.setattr(rate_limit_module, "redis_client", active_client)
        monkeypatch.setattr(startup_module, "redis_client", active_client)
        monkeypatch.setattr(factory_module, "redis_client", active_client)
        monkeypatch.setattr(main_module, "redis_client", active_client)

    try:
        keys = list(active_client.scan_iter(match="rl:*"))
        if keys:
            active_client.delete(*keys)
    except Exception:
        pass
    yield
    try:
        keys = list(active_client.scan_iter(match="rl:*"))
        if keys:
            active_client.delete(*keys)
    except Exception:
        pass


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    connection = db_session.connection()
    RequestSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    def override_get_db():
        request_db = RequestSessionLocal()
        try:
            yield request_db
        finally:
            request_db.close()

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app, client=("127.0.0.1", 50000)) as c:
            yield c
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def sample_pdf_bytes() -> bytes:
    return MINIMAL_PDF_BYTES
