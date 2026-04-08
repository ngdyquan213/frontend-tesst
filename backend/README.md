# Secure Travel Booking Platform

Security-focused travel booking backend built with FastAPI, SQLAlchemy, PostgreSQL, Alembic, Redis, and Docker.

This project is positioned as a backend security lab: it implements core booking flows, then hardens them with authentication, authorization, payment callback protection, upload controls, audit trails, and operational safeguards.

## Scope

- User authentication and token-based access control
- Flight, hotel, and tour booking flows
- Coupon application and abuse prevention
- Payment initiation and payment callback handling
- Traveler document upload/download
- Admin monitoring and export surfaces
- Audit logs, security events, rate limiting, and runtime maintenance jobs

## Production Gap

### Implemented

- JWT authentication, RBAC, ownership checks, refresh-token rotation
- Server-side booking amount calculation and transactional inventory updates
- Payment idempotency, callback signature verification, replay detection, amount/currency validation
- Live-ready Stripe payment initiation and webhook verification path alongside legacy mock callbacks
- Callback source allowlist based on IP/CIDR ranges
- Upload extension, MIME, and file-signature validation
- Optional malware scan hook for uploads with `mock` and `clamav` backends
- Structured logging for HTTP requests, payment flows, outbox processing, and startup checks
- Basic operational metrics at `GET /metrics`:
  - `http_requests_total`
  - `http_error_responses_total`
  - `payment_callback_failures_total`
  - `payment_callback_failures_by_reason`
  - `outbox_backlog`
  - `outbox_dispatch_failures_total`
  - `outbox_dispatch_failures_by_reason`
  - `rate_limit_backend_failures_total`
- Prometheus-compatible metrics at `GET /metrics/prometheus` with staging scrape rules for Redis, outbox, and payment callback alerting
- Outbox processing with lease-based claiming, retry/backoff, backlog visibility, and request-path enqueue only semantics
- Health probes for liveness and readiness
- Test suite, Ruff, Bandit, and pip-audit
- `pip check` in CI to verify a consistent installed dependency graph
- Coverage gate in CI with `pytest-cov`
- Deterministic demo seed for frontend/QA handoff via `make seed-demo`

### Mocked

- Legacy gateway flows (`vnpay`, `momo`) remain simulated and continue using the internal shared-secret callback model
- Email and notification workers support mock backends for development/testing
- Malware scanning can run in `mock` mode for local verification without a real antivirus daemon

### Planned

- WAF / reverse-proxy hardening and additional edge protections
- Production object storage patterns such as presigned URLs and lifecycle policies

## Observability Notes

- `GET /health`, `GET /health/live`, and `GET /health/ready` expose service health.
- `GET /health/ready`, `GET /metrics`, and `GET /metrics/prometheus` can be restricted with:
  - `OBSERVABILITY_PROTECTION_MODE`
  - `OBSERVABILITY_ALLOWLIST`
- `GET /health/ready` now includes readiness policy, outbox health, degraded checks, runtime-task state, and dependency signals for storage, email, notifications, malware scan, and rate limiting.
- `GET /metrics` returns a JSON snapshot of the in-process counters plus the current outbox backlog.
- `GET /metrics/prometheus` exposes Prometheus text format metrics including dependency readiness and runtime-task health.
- `infra/observability/prometheus.yml` scrapes the app in staging, and `infra/observability/alerts.yml` defines baseline alert rules for Redis readiness, outbox health, payment callback failures, and rate-limit backend failures.
- Payment and outbox logs now emit structured fields through logger `extra`, which are preserved by the JSON formatter in non-debug environments.

## Security Notes

- `PAYMENT_CALLBACK_SOURCE_ALLOWLIST` accepts a comma-separated set of IPs/CIDRs and is required in staging/production.
- `TRUSTED_HOSTS` must be explicitly configured and cannot fall back to a wildcard.
- Bundled Nginx now overwrites inbound `X-Forwarded-For` and clears `Forwarded` before proxying so observability allowlists, rate limiting, and audit logs are not influenced by client-supplied proxy headers.
- `OBSERVABILITY_PROTECTION_MODE=allowlist` is required in staging/production, and `OBSERVABILITY_ALLOWLIST` should contain only the monitoring/private networks that may reach readiness and metrics endpoints.
- Upload malware scanning is optional and controlled through:
  - `UPLOAD_MALWARE_SCAN_ENABLED`
  - `UPLOAD_MALWARE_SCAN_BACKEND`
  - `CLAMAV_HOST`
  - `CLAMAV_PORT`
  - `CLAMAV_TIMEOUT_SECONDS`
- Secret sourcing is described through:
  - `SECRET_SOURCE`
  - `SECRET_MANAGER_PROVIDER`
  - `SECRET_MANAGER_SECRET_ID`
  - `SECRET_MANAGER_AWS_REGION`
- Stripe integration is controlled through:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_API_BASE_URL`
  - `STRIPE_REQUEST_TIMEOUT_SECONDS`
  - `STRIPE_WEBHOOK_TOLERANCE_SECONDS`
- Both `/api/v1/payments/callback` and `/api/v1/payments/callback/stripe` use the sensitive payment-callback rate-limit policy and fail closed if the shared Redis limiter is unavailable.
- `OUTBOX_HEALTH_MODE` controls whether outbox health is `best_effort` or `required` for readiness.

## Environment Profiles

- `development`: local developer workflow using `.env` copied from `.env.example`, with reload/debug-friendly defaults.
- `test`: automated and local test profile using `.env.test.example` plus `infra/docker/docker-compose.test.yml` for PostgreSQL-backed test runs.
- `staging`: shared pre-production validation profile using `.env.staging.example` and `infra/docker/docker-compose.staging.yml`.
- `production`: hardened runtime profile using `.env.production.example` and `infra/docker/docker-compose.production.yml`, expecting external managed dependencies.

## Local Setup

1. Copy `.env.example` to `.env` and adjust values.
2. Start dependencies or the full stack with Docker Compose.
3. Run migrations.
4. Start the API with proxy headers enabled if traffic will arrive through Nginx or another reverse proxy.

Example commands:

```bash
alembic upgrade head
uvicorn app.main:app --reload --proxy-headers --forwarded-allow-ips="127.0.0.1,::1"
```

## Testing

- Copy `.env.test.example` if you want a dedicated local test env file.
- `python -m pytest -q` runs the full suite. Tests that require PostgreSQL now skip with a clear message if the database is unavailable.
- `make test-cov` runs the suite with a coverage report and enforces the configured threshold.
- `make test-fast` runs a portable subset that does not require external services.
- `make up-test-db` starts the PostgreSQL container used by the postgres-marked tests.
- `tests/test_migration_regressions.py` verifies the upgrade path from the pre-outbox schema revision to `head`, including the coupon-column repair migration.
- CI installs Python dependencies from `requirements-dev.lock` and then runs `pip check` so dependency resolution matches local lockfile-based setup more closely.

## Deployment Profiles

- `make up` / `make smoke-local` boot the development stack.
- `make up-staging` / `make smoke-staging` boot the staging stack with Prometheus and Mailhog.
- `make up-production` / `make smoke-production` boot the production app stack against externally provided Postgres, Redis, SMTP, and storage services.
- `make release-preflight` validates production env material before rollout.
- `make release-verify-demo` verifies the seeded QA journey after deployment and can be scaled with script flags for light concurrent load.
- The production compose profile separates `migrate` from `app` startup and supports TLS termination in Nginx when `NGINX_TLS_ENABLED=true`.

## Demo Seed

- `make seed-demo` creates a deterministic handoff dataset anchored at `2026-04-01T08:00:00+00:00`.
- The seed is idempotent and creates:
  - admin user `admin@example.com` / `Admin12345`
  - QA customer `qa.customer@example.com` / `Traveler12345`
  - fixed catalog data, coupons, and booking `BK-DEMO-FLIGHT-001`
- `python -m scripts.seed_demo_environment` seeds the full deterministic demo profile.
- `python scripts/seed_data.py --anchor-datetime ...` and `python scripts/seed_coupons.py --anchor-datetime ...` remain available if you only need deterministic catalog or coupon dates.

## Additional Docs

- `docs/api-examples.md` contains curl-based walkthroughs for the main API flows.
- `docs/release-checklist.md` is the go/no-go checklist for production release windows.
- `docs/backup-restore-runbook.md` documents backup expectations and restore drills.
- `docs/migration-runbook.md` documents migration rollout and rollback expectations.
- `docs/deployment.md` documents development, test, staging, and production bring-up patterns, smoke verification, Prometheus access, and demo seeding.
- `CONTRIBUTING.md` explains the local quality gates expected before changes are merged.

## Repository Layout

```text
app/        API, services, repositories, middleware, core runtime code
alembic/    Database migrations
tests/      Automated tests
docs/       Architecture and deployment notes
security/   Security controls, threat model, and reports
infra/      Docker and deployment assets
```
