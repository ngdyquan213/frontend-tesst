# Migration Runbook

## Purpose

This document describes the minimum safe rollout and rollback process for Alembic migrations in local, staging, and production-like environments.

## Preconditions

- A database backup or snapshot is available.
- The release artifact is already built.
- CI has run the migration path and application test suite.
- The operator knows the current revision and the target revision.

## Standard Rollout

1. Check the current revision:

```bash
alembic current
```

2. Check the target revision:

```bash
alembic heads
```

3. Apply migrations:

```bash
alembic upgrade head
```

4. Verify service health:

```bash
curl http://localhost:8000/health/ready
```

5. Review startup and runtime logs for repeated dependency or migration errors.

## Compose Rollout

Local:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build
```

Staging:

```bash
docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml up -d --build
```

Both compose flows run `alembic upgrade head` before the application process starts.

## Regression Coverage

- `tests/test_migration_regressions.py` upgrades a PostgreSQL database from revision `d8e9f0a1b2c3` to `head`.
- That regression test specifically checks the repaired coupon schema gap, the outbox tables/lease columns, and the nullable `payments.booking_id` change.

## Rollback Expectations

- Not every migration is perfectly reversible without data-loss risk.
- Any migration that drops data or reshapes records must be reviewed before production rollout.
- If a migration fails in the middle of rollout:
  - stop the rollout
  - keep the old app version stopped or scaled down if the schema is no longer compatible
  - restore from backup if downgrade is unsafe

## Minimal Rollback Procedure

1. Identify the previous revision:

```bash
alembic history --verbose
```

2. If the migration supports a safe downgrade:

```bash
alembic downgrade <previous_revision>
```

3. If downgrade is not safe:

- restore the database backup
- redeploy the previous application release

## Post-Rollout Checks

- `/health/live` returns `200`
- `/health/ready` returns `200`
- outbox backlog does not grow unexpectedly
- Prometheus still scrapes `secure-travel-app`
- smoke tests pass
