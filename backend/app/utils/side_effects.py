from __future__ import annotations

import logging
from collections.abc import Callable

logger = logging.getLogger("app.side_effects")


def run_post_commit_action(*, action_name: str, action: Callable[[], None]) -> None:
    try:
        action()
    except Exception:
        logger.exception("post_commit_action_failed | action=%s", action_name)
