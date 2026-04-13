from __future__ import annotations

import argparse
import asyncio
import signal
import sys

from app.core.config import settings
from app.core.runtime_heartbeat import is_runtime_worker_heartbeat_fresh
from app.core.runtime_tasks import run_noncritical_maintenance_loop


async def _run() -> None:
    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()

    for signame in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(signame, stop_event.set)

    await run_noncritical_maintenance_loop(
        stop_event=stop_event,
        interval_seconds=settings.RUNTIME_MAINTENANCE_INTERVAL_SECONDS,
        run_immediately=True,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the secure travel runtime worker.")
    parser.add_argument(
        "--healthcheck",
        action="store_true",
        help="Exit 0 when the shared runtime worker heartbeat is fresh.",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    if args.healthcheck:
        raise SystemExit(0 if is_runtime_worker_heartbeat_fresh() else 1)

    asyncio.run(_run())


if __name__ == "__main__":
    main(sys.argv[1:])
