from __future__ import annotations

import json
from collections.abc import Iterable
from datetime import datetime, timezone

from app.core.config import settings
from app.core.redis import redis_client

RUNTIME_WORKER_HEARTBEAT_KEY = "secure_travel:runtime_worker:heartbeat"
RUNTIME_WORKER_TASK_INDEX_KEY = "secure_travel:runtime_worker:tasks"
RUNTIME_WORKER_TASK_KEY_PREFIX = "secure_travel:runtime_worker:task:"
MIN_RUNTIME_HEARTBEAT_TTL_SECONDS = 60


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _heartbeat_ttl_seconds(interval_seconds: int | None = None) -> int:
    base_interval = interval_seconds or settings.RUNTIME_MAINTENANCE_INTERVAL_SECONDS
    return max(base_interval * 3, MIN_RUNTIME_HEARTBEAT_TTL_SECONDS)


def publish_runtime_worker_heartbeat(*, interval_seconds: int | None = None) -> None:
    redis_client.set(
        RUNTIME_WORKER_HEARTBEAT_KEY,
        _now_iso(),
        ex=_heartbeat_ttl_seconds(interval_seconds),
    )


def publish_runtime_task_state(
    task_name: str,
    task_state: dict[str, str | None],
    *,
    interval_seconds: int | None = None,
) -> None:
    ttl_seconds = _heartbeat_ttl_seconds(interval_seconds)
    key = f"{RUNTIME_WORKER_TASK_KEY_PREFIX}{task_name}"

    pipeline = redis_client.pipeline()
    pipeline.sadd(RUNTIME_WORKER_TASK_INDEX_KEY, task_name)
    pipeline.expire(RUNTIME_WORKER_TASK_INDEX_KEY, ttl_seconds)
    pipeline.set(key, json.dumps(task_state), ex=ttl_seconds)
    pipeline.execute()


def is_runtime_worker_heartbeat_fresh() -> bool:
    try:
        return bool(redis_client.get(RUNTIME_WORKER_HEARTBEAT_KEY))
    except Exception:
        return False


def load_runtime_task_snapshot(
    *,
    expected_task_names: Iterable[str] = (),
) -> dict[str, dict[str, str | None]]:
    task_names = set(expected_task_names)

    try:
        task_names.update(redis_client.smembers(RUNTIME_WORKER_TASK_INDEX_KEY))
    except Exception:
        return {}

    snapshot: dict[str, dict[str, str | None]] = {}
    for task_name in sorted(task_names):
        try:
            raw_payload = redis_client.get(f"{RUNTIME_WORKER_TASK_KEY_PREFIX}{task_name}")
        except Exception:
            return {}

        if not raw_payload:
            continue

        try:
            payload = json.loads(raw_payload)
        except (TypeError, ValueError):
            continue

        if isinstance(payload, dict):
            snapshot[task_name] = {
                key: str(value) if value is not None else None
                for key, value in payload.items()
            }

    return snapshot
