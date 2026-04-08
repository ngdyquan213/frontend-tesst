# Backup Restore Runbook

## Purpose

This runbook defines the minimum safe expectations around backup verification and restore drills for release-grade environments.

## Before Every Release

- Confirm a fresh PostgreSQL backup or cloud snapshot exists.
- Record:
  - backup identifier
  - timestamp
  - owner/operator
  - source cluster or instance
- Confirm object-storage versioning or snapshot coverage for upload buckets.
- Confirm the previous application artifact and env reference are still available.

## Minimum Restore Drill Cadence

- Staging restore drill: at least once per milestone cycle.
- Production restore drill: at least once per quarter or before a major schema release.

## PostgreSQL Restore Drill

1. Provision an isolated restore target.
2. Restore the latest backup into that target.
3. Run:
   - `alembic current`
   - sanity checks on `users`, `bookings`, `payments`, `uploaded_documents`, and `outbox_events`
4. Start the app against the restored database in an isolated environment.
5. Run:
   - `python scripts/smoke_local_stack.py ...`
   - `python scripts/release_verify_demo.py ...` if demo seed exists
6. Capture restore duration and verification results.

## Redis Recovery Expectations

Redis in this project is operational state, not the source of record.

If Redis is lost:

- expect rate-limit counters to reset
- expect transient notification queue/state loss if external durability is not added
- verify the app still reaches readiness after Redis recovery
- confirm rate-limit failure metrics do not continue increasing

## Object Storage Recovery Expectations

- Verify the bucket/container exists and app credentials still read/write successfully.
- Spot-check download of a known document object from a non-production restore target.
- Confirm lifecycle, retention, and versioning rules were not lost during recovery.

## Restore Success Criteria

- restored database reaches the expected Alembic revision
- app boot succeeds against restored dependencies
- readiness is healthy
- seeded or known user journeys pass
- payment and upload metadata records remain internally consistent

## Restore Failure Escalation

- stop the production release or rollback if the latest backup cannot be restored cleanly
- do not proceed with destructive schema rollout until restore confidence is re-established
- document the incident and update release notes/runbooks before the next window
