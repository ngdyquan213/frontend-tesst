"""fix missing coupon applicable product type column

Revision ID: a9b8c7d6e5f4
Revises: f9a0b1c2d3e4
Create Date: 2026-03-15 18:55:00.000000+00:00

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a9b8c7d6e5f4"
down_revision: Union[str, Sequence[str], None] = "f9a0b1c2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COUPON_PRODUCT_TYPE_ENUM = sa.Enum(
    "all",
    "flight",
    "hotel",
    "tour",
    name="coupon_applicable_product_type",
    native_enum=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    coupon_columns = {column["name"] for column in inspector.get_columns("coupons")}

    if "applicable_product_type" not in coupon_columns:
        op.add_column(
            "coupons",
            sa.Column(
                "applicable_product_type",
                COUPON_PRODUCT_TYPE_ENUM,
                nullable=False,
                server_default="all",
            ),
        )
        op.alter_column("coupons", "applicable_product_type", server_default=None)

    payment_columns = {column["name"]: column for column in inspector.get_columns("payments")}
    booking_id_column = payment_columns.get("booking_id")
    if booking_id_column is not None and booking_id_column.get("nullable") is False:
        op.alter_column("payments", "booking_id", existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    payment_columns = {column["name"]: column for column in inspector.get_columns("payments")}
    booking_id_column = payment_columns.get("booking_id")
    if booking_id_column is not None and booking_id_column.get("nullable") is True:
        op.alter_column("payments", "booking_id", existing_type=sa.UUID(), nullable=False)

    coupon_columns = {column["name"] for column in inspector.get_columns("coupons")}
    if "applicable_product_type" not in coupon_columns:
        return

    op.drop_column("coupons", "applicable_product_type")
