"""guard coupon usage races

Revision ID: f1a2b3c4d5e6
Revises: 8c1f9e6b7a21
Create Date: 2026-03-15 01:50:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "8c1f9e6b7a21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM coupon_usages cu
        USING (
            SELECT id
            FROM (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY coupon_id, booking_id
                        ORDER BY used_at, id
                    ) AS row_num
                FROM coupon_usages
            ) ranked
            WHERE ranked.row_num > 1
        ) duplicates
        WHERE cu.id = duplicates.id
        """
    )
    op.create_unique_constraint(
        "uq_coupon_usages_coupon_id_booking_id",
        "coupon_usages",
        ["coupon_id", "booking_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_coupon_usages_coupon_id_booking_id",
        "coupon_usages",
        type_="unique",
    )
