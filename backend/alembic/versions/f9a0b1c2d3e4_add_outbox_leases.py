"""add outbox leases

Revision ID: f9a0b1c2d3e4
Revises: e7f8a9b0c1d2
Create Date: 2026-03-15 10:55:00.000000+00:00

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f9a0b1c2d3e4"
down_revision: Union[str, Sequence[str], None] = "e7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("outbox_events", sa.Column("claim_token", sa.String(length=64), nullable=True))
    op.add_column("outbox_events", sa.Column("claimed_by", sa.String(length=128), nullable=True))
    op.add_column(
        "outbox_events",
        sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "outbox_events",
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "idx_outbox_events_status_lease_expires_at",
        "outbox_events",
        ["status", "lease_expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_outbox_events_status_lease_expires_at", table_name="outbox_events")
    op.drop_column("outbox_events", "lease_expires_at")
    op.drop_column("outbox_events", "processing_started_at")
    op.drop_column("outbox_events", "claimed_by")
    op.drop_column("outbox_events", "claim_token")
