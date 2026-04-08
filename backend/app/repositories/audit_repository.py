from sqlalchemy.orm import Session

from app.models.audit import AuditLog, SecurityEvent


class AuditRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_audit_log(self, audit_log: AuditLog) -> AuditLog:
        self.db.add(audit_log)
        self.db.flush()
        return audit_log

    def add_security_event(self, security_event: SecurityEvent) -> SecurityEvent:
        self.db.add(security_event)
        self.db.flush()
        return security_event
