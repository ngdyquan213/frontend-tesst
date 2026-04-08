from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.enums import LogActorType
from app.repositories.admin_dashboard_repository import AdminDashboardRepository
from app.services.audit_service import AuditService


class AdminDashboardService:
    def __init__(
        self,
        dashboard_repo: AdminDashboardRepository,
        db: Session | None = None,
        audit_service: AuditService | None = None,
    ) -> None:
        self.dashboard_repo = dashboard_repo
        self.db = db
        self.audit_service = audit_service

    def get_dashboard_summary(self, recent_limit: int = 10) -> dict:
        return {
            "booking_status_counts": self.dashboard_repo.get_booking_status_counts(),
            "payment_status_counts": self.dashboard_repo.get_payment_status_counts(),
            "refund_status_counts": self.dashboard_repo.get_refund_status_counts(),
            "revenue": self.dashboard_repo.get_revenue_summary(),
            "recent_activities": self.dashboard_repo.get_recent_activities(limit=recent_limit),
        }

    def get_dashboard_summary_for_admin(
        self,
        *,
        actor_user_id,
        recent_limit: int,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        summary = self.get_dashboard_summary(recent_limit=recent_limit)

        if self.db is None or self.audit_service is None:
            return summary

        try:
            self.audit_service.log_action(
                actor_type=LogActorType.admin,
                actor_user_id=actor_user_id,
                action="admin_view_dashboard_summary",
                resource_type="dashboard",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"recent_limit": recent_limit},
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return summary
