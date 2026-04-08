from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.role import Permission, Role, RolePermission


def ensure_permissions_exist(
    db: Session,
    permission_names: list[str] | tuple[str, ...],
) -> list[Permission]:
    existing = db.query(Permission).filter(Permission.name.in_(permission_names)).all()
    existing_by_name = {permission.name: permission for permission in existing}
    permissions: list[Permission] = []

    for name in permission_names:
        permission = existing_by_name.get(name)
        if permission is None:
            permission = Permission(name=name, description=f"Permission for {name}")
            db.add(permission)
            db.flush()
        permissions.append(permission)

    return permissions


def ensure_role_has_permissions(
    db: Session,
    *,
    role: Role,
    permission_names: list[str] | tuple[str, ...],
) -> None:
    permissions = ensure_permissions_exist(db, permission_names)
    existing_permission_ids = {
        role_permission.permission_id for role_permission in role.role_permissions
    }

    for permission in permissions:
        if permission.id in existing_permission_ids:
            continue
        db.add(RolePermission(role_id=role.id, permission_id=permission.id))

    db.flush()
