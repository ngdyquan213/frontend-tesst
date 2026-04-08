"""add document review state

Revision ID: b61d9a8e4c12
Revises: 7c1d2e4f5a66
Create Date: 2026-04-08 13:30:00.000000+00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b61d9a8e4c12"
down_revision: Union[str, Sequence[str], None] = "7c1d2e4f5a66"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "uploaded_documents",
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pending"),
    )
    op.add_column(
        "uploaded_documents",
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "uploaded_documents",
        sa.Column("reviewed_by_user_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_uploaded_documents_reviewed_by_user_id",
        "uploaded_documents",
        "users",
        ["reviewed_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_uploaded_documents_reviewed_by_user_id",
        "uploaded_documents",
        type_="foreignkey",
    )
    op.drop_column("uploaded_documents", "reviewed_by_user_id")
    op.drop_column("uploaded_documents", "reviewed_at")
    op.drop_column("uploaded_documents", "status")
