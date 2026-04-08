"""enforce payment idempotency guards

Revision ID: 8c1f9e6b7a21
Revises: 6d16d9a4b742
Create Date: 2026-03-15 01:20:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8c1f9e6b7a21"
down_revision: Union[str, Sequence[str], None] = "6d16d9a4b742"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY booking_id, idempotency_key
                    ORDER BY created_at, id
                ) AS row_num
            FROM payments
            WHERE booking_id IS NOT NULL
              AND idempotency_key IS NOT NULL
        )
        UPDATE payments
        SET idempotency_key = NULL
        FROM ranked
        WHERE payments.id = ranked.id
          AND ranked.row_num > 1
        """
    )
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                gateway_order_ref,
                ROW_NUMBER() OVER (
                    PARTITION BY gateway_order_ref
                    ORDER BY created_at, id
                ) AS row_num
            FROM payments
            WHERE gateway_order_ref IS NOT NULL
        )
        UPDATE payments
        SET gateway_order_ref = ranked.gateway_order_ref || '-legacy-' || payments.id::text
        FROM ranked
        WHERE payments.id = ranked.id
          AND ranked.row_num > 1
        """
    )
    op.create_unique_constraint(
        "uq_payments_booking_id_idempotency_key",
        "payments",
        ["booking_id", "idempotency_key"],
    )
    op.create_unique_constraint(
        "uq_payments_gateway_order_ref",
        "payments",
        ["gateway_order_ref"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_payments_gateway_order_ref",
        "payments",
        type_="unique",
    )
    op.drop_constraint(
        "uq_payments_booking_id_idempotency_key",
        "payments",
        type_="unique",
    )
