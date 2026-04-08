from __future__ import annotations

import os
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError

from tests.alembic_utils import drop_database, recreate_database, run_migrations


@pytest.mark.postgres
def test_alembic_upgrade_from_pre_outbox_revision_repairs_schema_gaps():
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_password = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = int(os.getenv("POSTGRES_PORT", "5432"))
    admin_db_name = os.getenv("POSTGRES_ADMIN_DB") or "secure_travel_booking"
    database_name = f"secure_travel_migration_regression_{uuid4().hex[:8]}"
    database_url = (
        f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{database_name}"
    )

    try:
        recreate_database(database_url, admin_db_name)
    except OperationalError:
        pytest.skip(
            "PostgreSQL is not available for migration regression tests. "
            "Start infra/docker/docker-compose.test.yml and rerun pytest."
        )

    engine = create_engine(database_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})

    try:
        run_migrations(database_url, "d8e9f0a1b2c3")

        with engine.begin() as conn:
            inspector = inspect(conn)
            assert "outbox_events" not in inspector.get_table_names()
            coupon_columns = {
                column["name"]: column for column in inspector.get_columns("coupons")
            }
            assert "applicable_product_type" not in coupon_columns

            payment_booking_column = {
                column["name"]: column for column in inspector.get_columns("payments")
            }["booking_id"]
            assert payment_booking_column["nullable"] is False

            conn.execute(
                text(
                    """
                    INSERT INTO coupons (
                        id,
                        code,
                        name,
                        coupon_type,
                        discount_value,
                        min_booking_amount,
                        used_count,
                        is_active
                    ) VALUES (
                        :id,
                        :code,
                        :name,
                        :coupon_type,
                        :discount_value,
                        :min_booking_amount,
                        :used_count,
                        :is_active
                    )
                    """
                ),
                {
                    "id": str(uuid4()),
                    "code": "MIGRATIONFIX",
                    "name": "Migration Fix Coupon",
                    "coupon_type": "percentage",
                    "discount_value": 10,
                    "min_booking_amount": 100000,
                    "used_count": 0,
                    "is_active": True,
                },
            )

        run_migrations(database_url, "head")

        with engine.begin() as conn:
            inspector = inspect(conn)
            outbox_columns = {
                column["name"] for column in inspector.get_columns("outbox_events")
            }
            assert {
                "claim_token",
                "claimed_by",
                "processing_started_at",
                "lease_expires_at",
            }.issubset(outbox_columns)

            coupon_columns = {
                column["name"]: column for column in inspector.get_columns("coupons")
            }
            assert "applicable_product_type" in coupon_columns
            coupon_product_type = conn.execute(
                text(
                    "SELECT applicable_product_type FROM coupons WHERE code = :code"
                ),
                {"code": "MIGRATIONFIX"},
            ).scalar_one()
            assert coupon_product_type == "all"

            payment_booking_column = {
                column["name"]: column for column in inspector.get_columns("payments")
            }["booking_id"]
            assert payment_booking_column["nullable"] is True
    finally:
        engine.dispose()
        drop_database(database_url, admin_db_name)
