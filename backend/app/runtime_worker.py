from __future__ import annotations

import asyncio
import signal

from app.core.config import settings
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


def main() -> None:
    asyncio.run(_run())


if __name__ == "__main__":
    main()
