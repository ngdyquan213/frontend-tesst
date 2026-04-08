"""add hotel room daily inventory

Revision ID: c2d3e4f5a6b7
Revises: f1a2b3c4d5e6
Create Date: 2026-03-15 02:20:00.000000+00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c2d3e4f5a6b7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hotel_room_inventories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("inventory_date", sa.Date(), nullable=False),
        sa.Column("available_rooms", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["room_id"], ["hotel_rooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "room_id",
            "inventory_date",
            name="uq_hotel_room_inventories_room_id_inventory_date",
        ),
        sa.CheckConstraint(
            "available_rooms >= 0",
            name="ck_hotel_room_inventories_available_rooms_non_negative",
        ),
    )
    op.create_index(
        "idx_hotel_room_inventories_room_id_date",
        "hotel_room_inventories",
        ["room_id", "inventory_date"],
    )


def downgrade() -> None:
    op.drop_index(
        "idx_hotel_room_inventories_room_id_date",
        table_name="hotel_room_inventories",
    )
    op.drop_table("hotel_room_inventories")
