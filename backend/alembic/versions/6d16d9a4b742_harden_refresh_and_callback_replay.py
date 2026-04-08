"""harden refresh and callback replay paths

Revision ID: 6d16d9a4b742
Revises: d34e4b0b35ae
Create Date: 2026-03-14 17:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6d16d9a4b742"
down_revision: Union[str, Sequence[str], None] = "d34e4b0b35ae"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payment_callbacks",
        sa.Column("gateway_transaction_ref", sa.String(length=255), nullable=True),
    )
    op.execute(
        """
        UPDATE payment_callbacks
        SET gateway_transaction_ref = COALESCE(
            callback_payload->>'gateway_transaction_ref',
            'legacy-' || id::text
        )
        WHERE gateway_transaction_ref IS NULL
        """
    )
    op.execute(
        """
        DELETE FROM payment_callbacks pc
        USING (
            SELECT id
            FROM (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY gateway_name, gateway_transaction_ref
                        ORDER BY received_at, id
                    ) AS row_num
                FROM payment_callbacks
            ) ranked
            WHERE ranked.row_num > 1
        ) duplicates
        WHERE pc.id = duplicates.id
        """
    )
    op.alter_column("payment_callbacks", "gateway_transaction_ref", nullable=False)
    op.create_index(
        "uq_payment_callbacks_gateway_name_transaction_ref",
        "payment_callbacks",
        ["gateway_name", "gateway_transaction_ref"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "uq_payment_callbacks_gateway_name_transaction_ref",
        table_name="payment_callbacks",
    )
    op.drop_column("payment_callbacks", "gateway_transaction_ref")
