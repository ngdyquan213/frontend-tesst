from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock


class RuntimeTaskState:
    def __init__(self) -> None:
        self._lock = Lock()
        self._tasks: dict[str, dict[str, str | None]] = {}

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def mark_started(self, task_name: str) -> None:
        with self._lock:
            task = self._tasks.setdefault(
                task_name,
                {
                    "status": "unknown",
                    "last_started_at": None,
                    "last_finished_at": None,
                    "last_success_at": None,
                    "last_failure_at": None,
                    "last_error": None,
                },
            )
            task["last_started_at"] = self._now_iso()

    def mark_success(self, task_name: str) -> None:
        with self._lock:
            task = self._tasks.setdefault(task_name, {})
            now = self._now_iso()
            task["status"] = "ok"
            task["last_finished_at"] = now
            task["last_success_at"] = now
            task["last_error"] = None

    def mark_failure(self, task_name: str, error_message: str) -> None:
        with self._lock:
            task = self._tasks.setdefault(task_name, {})
            now = self._now_iso()
            task["status"] = "failed"
            task["last_finished_at"] = now
            task["last_failure_at"] = now
            task["last_error"] = error_message

    def reset(self) -> None:
        with self._lock:
            self._tasks = {}

    def snapshot(self) -> dict[str, dict[str, str | None]]:
        with self._lock:
            return {
                task_name: dict(task_state)
                for task_name, task_state in sorted(self._tasks.items())
            }


runtime_task_state = RuntimeTaskState()
