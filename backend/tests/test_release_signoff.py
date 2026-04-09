from pathlib import Path

from scripts.release_signoff import evaluate_release_signoff, parse_manifest


def test_parse_manifest_reads_json(tmp_path: Path):
    manifest = tmp_path / "release_signoff.staging.json"
    manifest.write_text('{"environment":"staging"}', encoding="utf-8")

    parsed = parse_manifest(manifest)

    assert parsed["environment"] == "staging"


def test_release_signoff_accepts_complete_manifest():
    manifest = {
        "environment": "staging",
        "owners": {
            "release_owner": "platform-oncall",
            "rollback_owner": "backend-oncall",
            "monitoring_owner": "sre-oncall",
            "approval_channel": "#release-war-room",
        },
        "rollout": {
            "strategy": "pilot-soft-launch",
            "initial_exposure": "internal-only",
            "widen_after": "24h-no-critical-alerts",
            "watch_window": "72h",
        },
        "monitoring": {
            "dashboard_url": "https://monitoring.example.com/d/secure-travel-app",
            "metrics_url": "https://monitoring.example.com/prometheus/targets",
            "alert_route": "pagerduty:secure-travel-primary",
            "alerts": [
                "SecureTravelAppTargetDown",
                "SecureTravelReadinessDegraded",
                "SecureTravelRedisDown",
                "SecureTravelOutboxBacklogHigh",
                "SecureTravelPaymentCallbackFailuresSpike",
                "SecureTravelHttp5xxSpike",
                "SecureTravelRateLimitBackendFailures",
            ],
        },
        "verification": {
            "preflight_command": "python scripts/release_preflight.py --env-file .env.staging",
            "release_gate_command": "make release-gate-staging",
            "staging_e2e_command": "make frontend-e2e-staging",
            "manual_flows": [
                {"name": "auth", "owner": "qa"},
                {"name": "booking", "owner": "qa"},
                {"name": "payment", "owner": "qa"},
                {"name": "documents", "owner": "qa"},
                {"name": "admin_tours", "owner": "qa"},
            ],
        },
        "rollback": {
            "trigger_summary": "Rollback on payment or readiness regressions.",
            "runbook": "docs/migration-runbook.md",
            "artifact_reference": "previous-stable-image-tag",
        },
    }

    errors = evaluate_release_signoff(
        manifest,
        expected_environment="staging",
    )

    assert errors == []


def test_release_signoff_rejects_missing_required_entries():
    manifest = {
        "environment": "production",
        "owners": {
            "release_owner": "TBD",
        },
        "monitoring": {
            "alerts": ["SecureTravelAppTargetDown"],
        },
        "verification": {
            "manual_flows": [{"name": "auth"}],
        },
    }

    errors = evaluate_release_signoff(
        manifest,
        expected_environment="production",
    )

    assert "owners.release_owner is required" in errors
    assert "owners.rollback_owner is required" in errors
    assert any(
        error.startswith("monitoring.alerts is missing required alerts:")
        for error in errors
    )
    assert any(
        error.startswith("verification.manual_flows is missing required flows:")
        for error in errors
    )
