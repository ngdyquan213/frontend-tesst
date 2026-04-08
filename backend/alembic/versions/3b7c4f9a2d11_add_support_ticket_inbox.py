"""add support ticket inbox

Revision ID: 3b7c4f9a2d11
Revises: a9b8c7d6e5f4, d34e4b0b35ae
Create Date: 2026-04-08 09:20:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3b7c4f9a2d11"
down_revision: Union[str, Sequence[str], None] = ("a9b8c7d6e5f4", "d34e4b0b35ae")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "support_tickets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("reference", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=True),
        sa.Column("requester_name", sa.String(length=255), nullable=False),
        sa.Column("requester_email", sa.String(length=255), nullable=False),
        sa.Column("topic_id", sa.String(length=100), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference"),
    )
    op.create_index("idx_support_tickets_booking_id", "support_tickets", ["booking_id"], unique=False)
    op.create_index("idx_support_tickets_reference", "support_tickets", ["reference"], unique=False)
    op.create_index("idx_support_tickets_status", "support_tickets", ["status"], unique=False)
    op.create_index("idx_support_tickets_user_id", "support_tickets", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_support_tickets_user_id", table_name="support_tickets")
    op.drop_index("idx_support_tickets_status", table_name="support_tickets")
    op.drop_index("idx_support_tickets_reference", table_name="support_tickets")
    op.drop_index("idx_support_tickets_booking_id", table_name="support_tickets")
    op.drop_table("support_tickets")
