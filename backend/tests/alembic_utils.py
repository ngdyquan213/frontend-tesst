from __future__ import annotations

import os
from pathlib import Path

from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url

from alembic import command

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ALEMBIC_INI_PATH = PROJECT_ROOT / "alembic.ini"
ALEMBIC_SCRIPT_PATH = PROJECT_ROOT / "alembic"


def alembic_config(database_url: str) -> Config:
    config = Config(str(ALEMBIC_INI_PATH))
    config.set_main_option("script_location", str(ALEMBIC_SCRIPT_PATH))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def run_migrations(database_url: str, revision: str = "head") -> None:
    config = alembic_config(database_url)
    _run_alembic_command(database_url, lambda: command.upgrade(config, revision))


def downgrade_migrations(database_url: str, revision: str) -> None:
    config = alembic_config(database_url)
    _run_alembic_command(database_url, lambda: command.downgrade(config, revision))


def recreate_database(database_url: str, admin_database: str) -> None:
    target_url = make_url(database_url)
    admin_engine = _admin_engine(target_url, admin_database)
    try:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    """
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = :name AND pid <> pg_backend_pid()
                    """
                ),
                {"name": target_url.database},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{target_url.database}"'))
            conn.execute(text(f'CREATE DATABASE "{target_url.database}" TEMPLATE template0'))
    finally:
        admin_engine.dispose()


def drop_database(database_url: str, admin_database: str) -> None:
    target_url = make_url(database_url)
    admin_engine = _admin_engine(target_url, admin_database)
    try:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    """
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = :name AND pid <> pg_backend_pid()
                    """
                ),
                {"name": target_url.database},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{target_url.database}"'))
    finally:
        admin_engine.dispose()


def _admin_engine(target_url, admin_database: str):
    admin_url = URL.create(
        drivername=target_url.drivername,
        username=target_url.username,
        password=target_url.password,
        host=target_url.host,
        port=target_url.port,
        database=admin_database,
    )
    admin_engine = create_engine(
        admin_url,
        isolation_level="AUTOCOMMIT",
        connect_args={"connect_timeout": 2},
    )
    return admin_engine


def _run_alembic_command(database_url: str, callback) -> None:
    from app.core.config import settings

    previous_value = os.environ.get("DATABASE_URL")
    previous_settings_url = settings.DATABASE_URL
    os.environ["DATABASE_URL"] = database_url
    settings.DATABASE_URL = database_url
    try:
        callback()
    finally:
        settings.DATABASE_URL = previous_settings_url
        if previous_value is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_value
