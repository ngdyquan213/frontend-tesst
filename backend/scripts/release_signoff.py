from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PLACEHOLDER_VALUES = {
    "",
    "tbd",
    "todo",
    "replace_me",
    "change-me",
    "changeme",
    "pending",
    "unknown",
}

REQUIRED_ALERTS = {
    "SecureTravelAppTargetDown",
    "SecureTravelReadinessDegraded",
    "SecureTravelRedisDown",
    "SecureTravelOutboxBacklogHigh",
    "SecureTravelPaymentCallbackFailuresSpike",
    "SecureTravelHttp5xxSpike",
    "SecureTravelRateLimitBackendFailures",
}

REQUIRED_FLOWS = {
    "auth",
    "booking",
    "payment",
    "documents",
    "admin_tours",
}


def parse_manifest(path: Path) -> dict[str, object]:
    if not path.exists():
        raise FileNotFoundError(f"Release signoff file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def _is_missing(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip().lower() in PLACEHOLDER_VALUES
    if isinstance(value, (list, dict)):
        return len(value) == 0
    return False


def evaluate_release_signoff(
    manifest: dict[str, object],
    *,
    expected_environment: str,
) -> list[str]:
    errors: list[str] = []

    environment = str(manifest.get("environment", "")).strip()
    if environment != expected_environment:
        errors.append(f"environment must be {expected_environment}")

    owners = manifest.get("owners")
    if not isinstance(owners, dict):
        errors.append("owners block is required")
    else:
        for key in ("release_owner", "rollback_owner", "monitoring_owner", "approval_channel"):
            if _is_missing(owners.get(key)):
                errors.append(f"owners.{key} is required")

    rollout = manifest.get("rollout")
    if not isinstance(rollout, dict):
        errors.append("rollout block is required")
    else:
        for key in ("strategy", "initial_exposure", "widen_after", "watch_window"):
            if _is_missing(rollout.get(key)):
                errors.append(f"rollout.{key} is required")

    monitoring = manifest.get("monitoring")
    if not isinstance(monitoring, dict):
        errors.append("monitoring block is required")
    else:
        for key in ("dashboard_url", "metrics_url", "alert_route", "alerts"):
            if _is_missing(monitoring.get(key)):
                errors.append(f"monitoring.{key} is required")
        raw_alerts = monitoring.get("alerts", [])
        alert_names = set(raw_alerts) if isinstance(raw_alerts, list) else set()
        missing_alerts = sorted(REQUIRED_ALERTS - alert_names)
        if missing_alerts:
            errors.append(
                "monitoring.alerts is missing required alerts: "
                + ", ".join(missing_alerts)
            )

    verification = manifest.get("verification")
    if not isinstance(verification, dict):
        errors.append("verification block is required")
    else:
        for key in (
            "preflight_command",
            "release_gate_command",
            "staging_e2e_command",
            "manual_flows",
        ):
            if _is_missing(verification.get(key)):
                errors.append(f"verification.{key} is required")
        manual_flows = verification.get("manual_flows", [])
        if not isinstance(manual_flows, list):
            errors.append("verification.manual_flows must be a list")
        else:
            flow_names = {
                str(item.get("name", "")).strip()
                for item in manual_flows
                if isinstance(item, dict)
            }
            missing_flows = sorted(REQUIRED_FLOWS - flow_names)
            if missing_flows:
                errors.append(
                    "verification.manual_flows is missing required flows: "
                    + ", ".join(missing_flows)
                )

    rollback = manifest.get("rollback")
    if not isinstance(rollback, dict):
        errors.append("rollback block is required")
    else:
        for key in ("trigger_summary", "runbook", "artifact_reference"):
            if _is_missing(rollback.get(key)):
                errors.append(f"rollback.{key} is required")

    return errors


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate release signoff metadata.")
    parser.add_argument(
        "--signoff-file",
        required=True,
        help="Path to the release signoff JSON file.",
    )
    parser.add_argument(
        "--expected-environment",
        required=True,
        choices=("staging", "production"),
        help="Expected environment encoded in the release signoff file.",
    )
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON output.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    signoff_file = Path(args.signoff_file)
    try:
        manifest = parse_manifest(signoff_file)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    errors = evaluate_release_signoff(
        manifest,
        expected_environment=args.expected_environment,
    )
    report = {
        "signoff_file": str(signoff_file),
        "passed": not errors,
        "errors": errors,
    }
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        if errors:
            print("release_signoff: FAIL")
            for error in errors:
                print(f"- {error}")
        else:
            print("release_signoff: PASS")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
