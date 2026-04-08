from __future__ import annotations

import argparse
import json
import shlex
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GateStep:
    name: str
    command: list[str] | str
    shell: bool = False


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the fast-track release gate sequence for staging or production."
    )
    parser.add_argument("--base-url", required=True, help="App base URL, e.g. http://localhost:8080")
    parser.add_argument(
        "--api-base-url",
        help="API base URL for demo verification and load smoke. Defaults to <base-url>/api/v1.",
    )
    parser.add_argument(
        "--expected-environment",
        required=True,
        choices=("development", "staging", "production"),
        help="Expected environment returned by the health endpoints.",
    )
    parser.add_argument(
        "--prometheus-url",
        help="Optional Prometheus base URL to validate during smoke checks.",
    )
    parser.add_argument(
        "--env-file",
        help="Optional production env file to validate before smoke verification.",
    )
    parser.add_argument(
        "--check-local-files",
        action="store_true",
        help="Pass --check-local-files through release_preflight when env-file is provided.",
    )
    parser.add_argument(
        "--seed-command",
        help="Optional shell command to seed deterministic demo data before release verification.",
    )
    parser.add_argument("--skip-preflight", action="store_true")
    parser.add_argument("--skip-seed", action="store_true")
    parser.add_argument("--skip-demo", action="store_true")
    parser.add_argument("--skip-load", action="store_true")
    parser.add_argument("--demo-email", default="qa.customer@example.com")
    parser.add_argument("--demo-password", default="Traveler12345")
    parser.add_argument("--booking-code", default="BK-DEMO-FLIGHT-001")
    parser.add_argument("--demo-concurrency", type=int, default=3)
    parser.add_argument("--demo-iterations", type=int, default=2)
    parser.add_argument("--load-iterations", type=int, default=3)
    parser.add_argument("--load-concurrency", type=int, default=2)
    return parser


def build_steps(args: argparse.Namespace, *, python_executable: str) -> list[GateStep]:
    repo_root = Path(__file__).resolve().parents[1]
    api_base_url = args.api_base_url or f"{args.base_url.rstrip('/')}/api/v1"
    steps: list[GateStep] = []

    if args.env_file and not args.skip_preflight:
        command = [
            python_executable,
            str(repo_root / "scripts" / "release_preflight.py"),
            "--env-file",
            args.env_file,
        ]
        if args.check_local_files:
            command.append("--check-local-files")
        steps.append(GateStep(name="release_preflight", command=command))

    smoke_command = [
        python_executable,
        str(repo_root / "scripts" / "smoke_local_stack.py"),
        "--base-url",
        args.base_url,
        "--expected-environment",
        args.expected_environment,
    ]
    if args.prometheus_url:
        smoke_command.extend(["--prometheus-url", args.prometheus_url])
    steps.append(GateStep(name="smoke_local_stack", command=smoke_command))

    if args.seed_command and not args.skip_seed:
        steps.append(GateStep(name="seed_demo_environment", command=args.seed_command, shell=True))

    if not args.skip_demo:
        steps.append(
            GateStep(
                name="release_verify_demo",
                command=[
                    python_executable,
                    str(repo_root / "scripts" / "release_verify_demo.py"),
                    "--base-url",
                    api_base_url,
                    "--email",
                    args.demo_email,
                    "--password",
                    args.demo_password,
                    "--booking-code",
                    args.booking_code,
                    "--concurrency",
                    str(args.demo_concurrency),
                    "--iterations",
                    str(args.demo_iterations),
                ],
            )
        )

    if not args.skip_load:
        steps.append(
            GateStep(
                name="load_smoke",
                command=[
                    python_executable,
                    str(repo_root / "scripts" / "load_smoke.py"),
                    "--base-url",
                    api_base_url,
                    "--iterations",
                    str(args.load_iterations),
                    "--concurrency",
                    str(args.load_concurrency),
                ],
            )
        )

    return steps


def resolve_python_executable(repo_root: Path) -> str:
    venv_python = repo_root / ".venv" / "bin" / "python"
    if venv_python.exists():
        return str(venv_python)
    return sys.executable


def render_command(step: GateStep) -> str:
    if step.shell and isinstance(step.command, str):
        return step.command
    assert isinstance(step.command, list)
    return " ".join(shlex.quote(part) for part in step.command)


def run_step(step: GateStep, *, cwd: Path) -> dict[str, object]:
    started_at = time.perf_counter()
    completed = subprocess.run(
        step.command,
        cwd=cwd,
        shell=step.shell,
        check=False,
        text=True,
    )
    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    if completed.returncode != 0:
        raise subprocess.CalledProcessError(
            returncode=completed.returncode,
            cmd=render_command(step),
        )
    return {
        "name": step.name,
        "command": render_command(step),
        "duration_ms": duration_ms,
        "status": "passed",
    }


def main() -> int:
    args = build_parser().parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    steps = build_steps(args, python_executable=resolve_python_executable(repo_root))
    completed_steps: list[dict[str, object]] = []
    current_step_name: str | None = None

    try:
        for step in steps:
            current_step_name = step.name
            print(f"release_gate: running {step.name}")
            completed_steps.append(run_step(step, cwd=repo_root))
    except subprocess.CalledProcessError as exc:
        print("release_gate: FAIL")
        print(
            json.dumps(
                {
                    "passed": False,
                    "failed_step": current_step_name,
                    "command": exc.cmd,
                    "returncode": exc.returncode,
                    "completed_steps": completed_steps,
                },
                indent=2,
            )
        )
        return exc.returncode or 1

    print("release_gate: PASS")
    print(json.dumps({"passed": True, "steps": completed_steps}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
