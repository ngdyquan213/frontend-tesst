"""add notification read state

Revision ID: c9f4e6a1b2c3
Revises: b61d9a8e4c12
Create Date: 2026-04-08 21:20:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c9f4e6a1b2c3"
down_revision: Union[str, Sequence[str], None] = "b61d9a8e4c12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_read_states",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("notification_id", sa.String(length=120), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "notification_id",
            name="uq_notification_read_states_user_notification",
        ),
    )
    op.create_index(
        "idx_notification_read_states_user_id_read_at",
        "notification_read_states",
        ["user_id", "read_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_notification_read_states_user_id_read_at",
        table_name="notification_read_states",
    )
    op.drop_table("notification_read_states")
