try:
    from tests.conftest_postgres import *  # noqa: F403
except ModuleNotFoundError:
    from backend.tests.conftest_postgres import *  # type: ignore # noqa: F403
