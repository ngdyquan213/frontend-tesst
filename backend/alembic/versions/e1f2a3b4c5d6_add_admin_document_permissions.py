"""add admin document permissions

Revision ID: e1f2a3b4c5d6
Revises: c9f4e6a1b2c3
Create Date: 2026-04-09 10:00:00.000000+00:00

"""

from __future__ import annotations

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "c9f4e6a1b2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ADMIN_DOCUMENT_PERMISSIONS = (
    "admin.documents.read",
    "admin.documents.write",
)


def upgrade() -> None:
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

    conn = op.get_bind()
    existing_permissions = {
        row.name: row.id
        for row in conn.execute(
            sa.text("SELECT id, name FROM permissions WHERE name = ANY(:names)"),
            {"names": list(ADMIN_DOCUMENT_PERMISSIONS)},
        )
    }

    new_permissions = [
        {
            "id": uuid.uuid4(),
            "name": permission_name,
            "description": f"Permission for {permission_name}",
        }
        for permission_name in ADMIN_DOCUMENT_PERMISSIONS
        if permission_name not in existing_permissions
    ]
    if new_permissions:
        op.bulk_insert(permission_table, new_permissions)
        existing_permissions.update({item["name"]: item["id"] for item in new_permissions})

    admin_role_id = conn.execute(
        sa.text("SELECT id FROM roles WHERE name = :name"),
        {"name": "admin"},
    ).scalar_one_or_none()
    if admin_role_id is None:
        return

    existing_role_permission_ids = {
        row.permission_id
        for row in conn.execute(
            sa.text("SELECT permission_id FROM role_permissions WHERE role_id = :role_id"),
            {"role_id": admin_role_id},
        )
    }
    role_permissions = [
        {
            "role_id": admin_role_id,
            "permission_id": existing_permissions[permission_name],
        }
        for permission_name in ADMIN_DOCUMENT_PERMISSIONS
        if existing_permissions[permission_name] not in existing_role_permission_ids
    ]
    if role_permissions:
        op.bulk_insert(role_permission_table, role_permissions)


def downgrade() -> None:
    conn = op.get_bind()
    permission_ids = [
        row.id
        for row in conn.execute(
            sa.text("SELECT id FROM permissions WHERE name = ANY(:names)"),
            {"names": list(ADMIN_DOCUMENT_PERMISSIONS)},
        )
    ]
    if permission_ids:
        conn.execute(
            sa.text("DELETE FROM role_permissions WHERE permission_id = ANY(:permission_ids)"),
            {"permission_ids": permission_ids},
        )
        conn.execute(
            sa.text("DELETE FROM permissions WHERE id = ANY(:permission_ids)"),
            {"permission_ids": permission_ids},
        )
