import argparse
import sys

from scripts.release_gate import build_steps, render_command


def build_args(**overrides):
    base = {
        "base_url": "http://localhost:8080",
        "api_base_url": None,
        "expected_environment": "staging",
        "prometheus_url": "http://localhost:9090",
        "env_file": None,
        "check_local_files": False,
        "seed_command": "docker compose exec -T app python -m scripts.seed_demo_environment",
        "skip_preflight": False,
        "skip_seed": False,
        "skip_demo": False,
        "skip_load": False,
        "demo_email": "qa.customer@example.com",
        "demo_password": "Traveler12345",
        "booking_code": "BK-DEMO-FLIGHT-001",
        "demo_concurrency": 3,
        "demo_iterations": 2,
        "load_iterations": 3,
        "load_concurrency": 2,
    }
    base.update(overrides)
    return argparse.Namespace(**base)


def test_build_steps_for_staging_includes_smoke_seed_demo_and_load():
    args = build_args()

    steps = build_steps(args, python_executable=sys.executable)

    assert [step.name for step in steps] == [
        "smoke_local_stack",
        "seed_demo_environment",
        "release_verify_demo",
        "load_smoke",
    ]
    assert render_command(steps[0]).startswith(sys.executable)
    assert "--prometheus-url" in render_command(steps[0])


def test_build_steps_for_production_includes_preflight_and_can_skip_optional_checks():
    args = build_args(
        expected_environment="production",
        env_file=".env.production",
        check_local_files=True,
        seed_command=None,
        skip_demo=True,
        skip_load=True,
    )

    steps = build_steps(args, python_executable=sys.executable)

    assert [step.name for step in steps] == ["release_preflight", "smoke_local_stack"]
    assert "--check-local-files" in render_command(steps[0])
