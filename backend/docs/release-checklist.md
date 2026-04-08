# Release Checklist

## Purpose

This checklist is the go/no-go gate for a production release.

For the fast-track pilot path that also covers frontend scope hardening and live browser gates, use
[ready-production-fast-track.md](/Users/quan.nguyen/Desktop/stitch_travelbook_public_shell_guide/backend/docs/ready-production-fast-track.md)
alongside this document.

## Preflight

- Run the full local/CI quality gate:
  - `pip check`
  - `python -m pytest --cov=app --cov-report=term-missing -q`
  - `ruff check app tests scripts`
  - `bandit -r app -x tests`
  - `pip-audit`
- Validate production env material:
  - `python scripts/release_preflight.py --env-file .env.production --check-local-files`
- Confirm release notes mention schema, config, operational risk, and rollback expectations.
- Confirm a fresh database backup/snapshot exists and the previous stable artifact is still available.
- Confirm the alerting surface is active for:
  - `SecureTravelAppTargetDown`
  - `SecureTravelReadinessDegraded`
  - `SecureTravelRedisDown`
  - `SecureTravelOutboxBacklogHigh`
  - `SecureTravelPaymentCallbackFailuresSpike`
  - `SecureTravelHttp5xxSpike`
  - `SecureTravelRateLimitBackendFailures`

## Deployment

1. Announce the release window and rollback owner.
2. Confirm the current revision:
   - `alembic current`
3. Apply migrations:
   - `alembic upgrade head`
4. Roll out the application:
   - `docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml up -d --build`
5. Confirm `migrate`, `app`, and `nginx` complete/start cleanly.

## Post-Deploy Verification

- Run:
  - `python scripts/smoke_local_stack.py --base-url http://localhost:8081 --expected-environment production`
- Prefer the consolidated release gate when available:
  - `make release-gate-production`
- If the target contains the deterministic QA seed, run:
  - `python scripts/release_verify_demo.py --base-url http://localhost:8081/api/v1`
- Confirm:
  - `/health/live` and `/health/ready` return `200`
  - metrics scraping remains healthy
  - no repeated startup/runtime errors in logs
  - outbox backlog stays stable
  - login, booking read, and payment status flows work for the QA user

## Performance Spot Check

- Run a light concurrent verification before broad traffic exposure:
  - `python scripts/release_verify_demo.py --base-url http://localhost:8081/api/v1 --concurrency 5 --iterations 5`
- Run the dedicated API load smoke if the release window allows it:
  - `python scripts/load_smoke.py --base-url http://localhost:8081/api/v1`
- Review failure count and latency output.

## Go / No-Go Rules

- `NO-GO` if release preflight fails.
- `NO-GO` if migrations fail or schema state is unknown.
- `NO-GO` if smoke/load verification fails or `make release-gate-production` fails.
- `NO-GO` if readiness stays failed/degraded or payment flows regress.
- `GO` only when preflight, rollout, smoke, and basic load verification all pass.

## Rollback Trigger

Rollback immediately if any of the following happen after deployment:

- repeated 5xx responses on core routes
- readiness stays failed or degraded beyond the accepted window
- payment initiation or callback processing breaks
- outbox stops draining and backlog grows unexpectedly
- auth or document access behavior changes unexpectedly

Use [migration-runbook.md](/Users/quan.nguyen/Desktop/stitch_travelbook_public_shell_guide/backend/docs/migration-runbook.md) and [backup-restore-runbook.md](/Users/quan.nguyen/Desktop/stitch_travelbook_public_shell_guide/backend/docs/backup-restore-runbook.md) together for rollback execution.
