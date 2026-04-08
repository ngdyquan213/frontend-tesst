from __future__ import annotations

from collections.abc import Iterable


class ApplicationService:
    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def refresh_all(self, *instances) -> None:
        for instance in instances:
            if instance is not None:
                self.db.refresh(instance)

    def commit_and_refresh(self, *instances) -> None:
        self.commit()
        self.refresh_all(*instances)

    def refresh_many(self, instances: Iterable[object | None]) -> None:
        self.refresh_all(*instances)
