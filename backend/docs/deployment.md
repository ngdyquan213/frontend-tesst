# Deployment Runbook

This repository now separates runtime behavior into four environment profiles:

- `development`: fast local iteration with `.env` and the default Docker Compose stack
- `test`: isolated test execution with `.env.test.example` and the dedicated PostgreSQL test container
- `staging`: shared pre-production stack with its own env file, persistent uploads, Prometheus, and Mailhog
- `production`: hardened app-layer stack using `.env.production` and external managed dependencies

## Local Production-Like

Use this when you want fast local verification through Nginx on your workstation.

### Bring Up

```powershell
docker compose -f infra/docker/docker-compose.yml up -d --build
```

If your host already uses `80`, `5432`, or `6379`, override them temporarily:

```powershell
$env:HOST_HTTP_PORT="8080"
$env:HOST_POSTGRES_PORT="5434"
$env:HOST_REDIS_PORT="6380"
docker compose -f infra/docker/docker-compose.yml up -d --build
```

### Verify

```powershell
docker compose -f infra/docker/docker-compose.yml ps
python scripts/smoke_local_stack.py --expected-environment development
```

If you overrode the HTTP port:

```powershell
python scripts/smoke_local_stack.py --base-url http://localhost:8080 --expected-environment development
```

Expected result:

- `postgres`, `redis`, `app`, and `nginx` are healthy
- `/health/live` returns `200`
- `/health/ready` returns `200`
- readiness reports both database and Redis as `true`
- Nginx includes the expected security headers

## Test

Use this when you want a clean PostgreSQL instance for local integration tests or CI-like validation.

### Prepare Env

If you want a dedicated local test env file:

```powershell
Copy-Item .env.test.example .env.test
```

### Bring Up

```powershell
docker compose -f infra/docker/docker-compose.test.yml up -d
```

### Verify

```powershell
docker compose -f infra/docker/docker-compose.test.yml ps
python -m pytest -q
```

For postgres-marked tests only:

```powershell
TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5433/secure_travel_booking_test python -m pytest -q -m postgres tests/test_postgres_smoke.py tests/test_postgres_coupon_json.py
```

### Tear Down

```powershell
docker compose -f infra/docker/docker-compose.test.yml down
```

## Staging-Ready

Use this when you want a dedicated deployment profile that behaves closer to a shared environment.

### Prepare Env

1. Create a staging env file from the tracked example:

```powershell
Copy-Item .env.staging.example .env.staging
```

2. Replace the sample values before sharing the environment:

- `SECRET_KEY`
- `PAYMENT_CALLBACK_SECRET`
- `POSTGRES_PASSWORD`
- `CORS_ORIGINS`
- `TRUSTED_HOSTS`

Notes:

- `ENVIRONMENT=staging` enforces stricter validation than development.
- `DEBUG=true`, localhost-backed database URLs, localhost-backed Redis URLs, and payment simulation are rejected in staging.
- `TRUSTED_HOSTS` in the tracked staging example includes `app` and `app:8000` so internal Prometheus scrapes do not fail trusted-host validation.
- The bundled Nginx profile sanitizes proxy identity headers by overwriting `X-Forwarded-For` with the direct peer address and clearing `Forwarded` before passing traffic to the app.
- `OBSERVABILITY_PROTECTION_MODE=allowlist` is required in staging, and the tracked `OBSERVABILITY_ALLOWLIST` covers localhost plus RFC1918 networks so Prometheus and internal smoke checks can still reach `/health/ready` and `/metrics/prometheus`.
- Email/notification delivery stays off the request path; pending outbox events are drained by the runtime maintenance loop only.
- The staging compose profile now includes a local SMTP sink at service `mailhog`, so the default staging env can pass worker connectivity checks without pointing at a real mail server.
- Malware scanning is disabled in the tracked staging example by default. If you enable ClamAV-backed scanning, provision a reachable `clamav` service first or `/health/ready` will fail.
- `OUTBOX_HEALTH_MODE=required` makes `/health/ready` fail when outbox dispatch is unhealthy or the outbox schema is missing.
- Staging migrations now run in a dedicated `migrate` service before the API starts.
- Stripe callbacks inherit the same strict rate-limit and fail-closed behavior as the legacy payment callback route.

### Bring Up

```powershell
docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml up -d --build
```

If you need a temporary staging env variant for smoke validation, override `APP_ENV_FILE`:

```powershell
$env:APP_ENV_FILE="../../.env.staging.codex"
docker compose --env-file .env.staging.codex -f infra/docker/docker-compose.staging.yml up -d --build
```

The staging compose file differs from local compose in a few important ways:

- it uses `.env.staging`
- it does not publish Postgres or Redis to the host by default
- it persists uploads in a Docker volume
- it defaults HTTP to port `8080`

### Verify

```powershell
docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml ps
python scripts/smoke_local_stack.py --base-url http://localhost:8080 --prometheus-url http://localhost:9090 --expected-environment staging
```

Expected result:

- `nginx`, `app`, `postgres`, `redis`, `mailhog`, and `prometheus` are up
- `/health/live` reports `environment=staging`
- `/health/ready` returns `200`
- readiness reports database, Redis, email worker, notification backend, malware scan, and outbox as `true`
- Prometheus reports the `secure-travel-app` target as `up`
- baseline alert rules for Redis, outbox, payment callbacks, and rate-limit backend failures are loaded

### Tear Down

```powershell
docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml down
```

To also remove volumes:

```powershell
docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml down -v
```

## Production

Use this when you want a separate production profile with stricter settings and externally managed dependencies.

### Prepare Env

1. Create the production env file from the tracked example:

```powershell
Copy-Item .env.production.example .env.production
```

2. Replace the sample values before rollout:

- `SECRET_KEY`
- `PAYMENT_CALLBACK_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ORIGINS`
- `TRUSTED_HOSTS`
- `OBSERVABILITY_ALLOWLIST`
- `S3_*`
- `SMTP_*`

Notes:

- `ENVIRONMENT=production` enforces the same strict runtime validation as staging.
- `infra/docker/docker-compose.production.yml` now runs a one-shot `migrate` service before `app`; PostgreSQL, Redis, SMTP, and object storage must already be reachable.
- The tracked production example uses AWS Secrets Manager bootstrap via `SECRET_MANAGER_SECRET_ID` and `SECRET_MANAGER_AWS_REGION`; the app loads JSON key/value secrets into the process environment before settings initialization.
- `STORAGE_BACKEND=s3` is the default production template because the repository's local filesystem storage is mainly for development and test workflows.
- The bundled Nginx production entrypoint also sanitizes forwarded identity headers before proxying so allowlist-based observability checks and audit logging use trusted proxy data only.
- Set `NGINX_TLS_ENABLED=true` together with mounted cert/key files for direct internet-facing deployments, or terminate TLS and WAF policies upstream and keep `FORWARDED_ALLOW_IPS` aligned with that proxy layer.
- Stripe can be enabled in production with `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`.
- If you expose Prometheus in production, keep using `OBSERVABILITY_PROTECTION_MODE=allowlist` and smoke it separately with `--prometheus-url`.

### Bring Up

```powershell
docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml up -d --build
```

If you are terminating TLS directly in the bundled Nginx:

```powershell
$env:NGINX_TLS_ENABLED="true"
$env:NGINX_CERTS_DIR="C:/path/to/certs"
docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml up -d --build
```

### Verify

```powershell
docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml ps
python scripts/smoke_local_stack.py --base-url http://localhost:8081 --expected-environment production
```

Expected result:

- `migrate`, `app`, and `nginx` complete successfully and remain healthy where applicable
- `/health/live` reports `environment=production`
- `/health/ready` returns `200`
- readiness reports database, Redis, storage, email worker, notification backend, malware scan, and outbox as healthy against the configured external services

### Tear Down

```powershell
docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml down
```

## Useful Commands

```powershell
make up
make up-test-db
make test-postgres
make smoke-local
make up-staging
make smoke-staging
make logs-staging
make down-staging
make up-production
make smoke-production
make logs-production
make down-production
make release-preflight
make release-verify-demo
```

If `make` is unavailable on Windows, run the underlying Docker and Python commands directly.

## Demo Seed For Frontend and QA

Use the deterministic seed when frontend, QA, or interview reviewers need a known dataset.

```powershell
python -m scripts.seed_demo_environment
```

Or with `make`:

```powershell
make seed-demo
```

The command is idempotent and creates:

- admin user `admin@example.com` / `Admin12345`
- QA customer `qa.customer@example.com` / `Traveler12345`
- fixed catalog dates anchored at `2026-04-01T08:00:00+00:00`
- booking `BK-DEMO-FLIGHT-001`
- coupons `WELCOME10`, `FLIGHT200K`, `HOTEL15`, and `TOUR300K`

## Prometheus Access

The staging compose profile exposes Prometheus on `http://localhost:9090` by default through `HOST_PROMETHEUS_PORT`.

Useful checks:

```powershell
Invoke-WebRequest http://localhost:9090/-/ready
Invoke-WebRequest http://localhost:9090/api/v1/targets
Invoke-WebRequest http://localhost:9090/api/v1/rules?type=alert
```

The app metrics endpoint scraped by Prometheus is:

```text
http://app:8000/metrics/prometheus
```

## Release Workflow Additions

Two repo-local helpers are now available for release-grade verification:

- `python scripts/release_preflight.py --env-file .env.production --check-local-files`
  - validates production env material before rollout
  - rejects placeholder/demo values, localhost dependencies, mock workers, and incomplete Stripe configuration
- `python scripts/release_verify_demo.py --base-url http://localhost:8081/api/v1`
  - logs in with the seeded QA account
  - verifies `/users/me`, catalog, booking list, and payment status for `BK-DEMO-FLIGHT-001`
  - supports `--concurrency` and `--iterations` for light concurrent verification after deploy

See also:

- [release-checklist.md](/E:/secure-travel-booking-platform-test/docs/release-checklist.md)
- [backup-restore-runbook.md](/E:/secure-travel-booking-platform-test/docs/backup-restore-runbook.md)
