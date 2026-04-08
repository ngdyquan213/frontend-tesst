import json
import logging
import sys

from app.core.logging import JsonFormatter, StructuredDebugFormatter, build_log_extra


def test_json_formatter_includes_structured_data_and_exception():
    formatter = JsonFormatter()
    logger = logging.getLogger("test.json.formatter")

    try:
        raise RuntimeError("boom")
    except RuntimeError:
        record = logger.makeRecord(
            name=logger.name,
            level=logging.ERROR,
            fn=__file__,
            lno=42,
            msg="structured error",
            args=(),
            exc_info=sys.exc_info(),
            extra=build_log_extra("test_event", user_id="u-1"),
        )

    payload = json.loads(formatter.format(record))

    assert payload["message"] == "structured error"
    assert payload["event"] == "test_event"
    assert payload["user_id"] == "u-1"
    assert "exception" in payload
    assert payload["lineno"] == 42


def test_structured_debug_formatter_renders_event_and_fields():
    formatter = StructuredDebugFormatter("%(levelname)s %(message)s")
    logger = logging.getLogger("test.debug.formatter")
    record = logger.makeRecord(
        name=logger.name,
        level=logging.INFO,
        fn=__file__,
        lno=21,
        msg="debug line",
        args=(),
        exc_info=None,
        extra=build_log_extra("upload_started", filename="passport.pdf", size=12),
    )

    rendered = formatter.format(record)

    assert "INFO debug line" in rendered
    assert "event=upload_started" in rendered
    assert "filename=passport.pdf" in rendered
    assert "size=12" in rendered
