"""add permissions and role permissions

Revision ID: d8e9f0a1b2c3
Revises: c2d3e4f5a6b7
Create Date: 2026-03-15 03:10:00.000000+00:00

"""
from __future__ import annotations

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d8e9f0a1b2c3"
down_revision: Union[str, Sequence[str], None] = "c2d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ADMIN_PERMISSIONS = (
    "admin.users.read",
    "admin.bookings.read",
    "admin.payments.read",
    "admin.audit_logs.read",
    "admin.coupons.read",
    "admin.coupons.write",
    "admin.refunds.read",
    "admin.refunds.write",
    "admin.tours.read",
    "admin.tours.write",
    "admin.dashboard.read",
    "admin.exports.read",
)


def upgrade() -> None:
    op.create_table(
        "permissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("permission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "granted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    permission_table = sa.table(
        "permissions",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String(length=100)),
        sa.column("description", sa.Text()),
    )
    role_permission_table = sa.table(
        "role_permissions",
        sa.column("role_id", postgresql.UUID(as_uuid=True)),
        sa.column("permission_id", postgresql.UUID(as_uuid=True)),
    )

    permissions = [
        {
            "id": uuid.uuid4(),
            "name": permission_name,
            "description": f"Permission for {permission_name}",
        }
        for permission_name in ADMIN_PERMISSIONS
    ]
    op.bulk_insert(permission_table, permissions)

    conn = op.get_bind()
    admin_role_id = conn.execute(
        sa.text("SELECT id FROM roles WHERE name = :name"),
        {"name": "admin"},
    ).scalar_one_or_none()

    if admin_role_id is None:
        return

    op.bulk_insert(
        role_permission_table,
        [
            {
                "role_id": admin_role_id,
                "permission_id": permission["id"],
            }
            for permission in permissions
        ],
    )


def downgrade() -> None:
    op.drop_table("role_permissions")
    op.drop_table("permissions")
