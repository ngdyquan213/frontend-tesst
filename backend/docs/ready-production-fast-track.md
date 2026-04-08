# Fast-Track Ready-Production Checklist

## Purpose

This checklist turns the pilot-release plan into an execution path that can be repeated without reopening strategy discussions.

Scope defaults for this track:

- account-level `travelers` CRUD stays out of scope for this release
- `documents` supports upload, list, and detail only
- admin tours supports create/edit metadata only
- target outcome is a controlled production or pilot launch

## Phase 1: Lock Scope and Production UX

- [x] Remove `travelers` from production navigation and route entry points
- [x] Keep travelers data booking-scoped instead of adding account-level CRUD
- [x] Remove document delete from production UI and frontend API surface
- [x] Keep admin tours on create/edit metadata only
- [x] Review production routes and remove any remaining placeholder or half-wired flows

## Phase 2: Frontend-Backend Contract

- [x] Keep admin tour create/edit on existing backend endpoints
- [x] Keep document flows on the existing upload/list/detail backend contract
- [x] Avoid adding new public APIs for travelers or document deletion in this release
- [x] Normalize frontend mock behavior so query invalidation reflects document upload and admin-tour edits correctly
- [x] Recheck core error handling for auth, booking, payment, documents, and admin tours against the live backend

## Phase 3: Required Quality Gates

Frontend gates:

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run test:e2e`
- [x] Add live Playwright coverage for auth, documents, and admin tours

Backend gates:

- [x] `./.venv/bin/ruff check app tests scripts`
- [x] `./.venv/bin/pytest -q`
- [x] `./.venv/bin/bandit -q -r app`
- [x] Migration upgrade smoke on the target stack

CI gates:

- [x] Frontend build, lint, integration, and mock E2E in CI
- [x] Backend ruff, pytest, and bandit in CI
- [x] Stack smoke job that boots the backend containers
- [x] Live browser smoke job against the running backend stack

## Phase 4: Staging-Like Verification

- [ ] Prepare `.env.staging` with real secrets, hosts, storage, SMTP, Redis, and Postgres
- [ ] Run `python scripts/release_preflight.py --env-file .env.staging --check-local-files`
- [ ] Bring up staging stack: `make up-staging`
- [ ] Verify staging stack: `make smoke-staging`
- [ ] Prefer the consolidated gate once staging is up: `make release-gate-staging`
- [x] Seed deterministic QA data if the local pilot flow depends on it
- [ ] Run live frontend E2E against staging
- [ ] Verify auth, booking, payment, document upload, and admin tour flows manually once on staging

## Phase 5: Ops, Load, and Rollout

- [ ] Confirm monitoring for app target health, readiness degradation, request failures, payment callback failures, HTTP 5xx spikes, and outbox backlog
- [x] Run lightweight load smoke: `make load-smoke`
- [x] Record latency and failure output for login, checkout, and upload paths
- [ ] Confirm deploy sequence for staging then production
- [ ] Confirm rollback owner and rollback checklist before release
- [ ] Release with pilot or soft-launch controls
- [ ] Monitor the first 24-72 hours before widening access

## Release Command Set

Use this order when preparing a pilot release:

```bash
# frontend
cd frontend
npm run build
npm run lint
npm test
npm run test:e2e

# backend
cd ../backend
./.venv/bin/ruff check app tests scripts
./.venv/bin/pytest -q
./.venv/bin/bandit -q -r app
python scripts/release_preflight.py --env-file .env.staging --check-local-files

# staging-like stack
make up-staging
make smoke-staging
make release-gate-staging
```

Local proof completed on April 9, 2026:

- `python3 backend/scripts/smoke_local_stack.py --base-url http://127.0.0.1:8000 --expected-environment development`
- `docker compose exec -T backend python -m scripts.seed_demo_environment`
- `LOAD_SMOKE_BASE_URL=http://127.0.0.1:8000/api/v1 make -C backend load-smoke`
- `python backend/scripts/release_gate.py --base-url http://127.0.0.1:8000 --api-base-url http://127.0.0.1:8000/api/v1 --expected-environment development --skip-preflight --skip-seed --skip-demo`

## No-Go Conditions

- any production route still leads to a half-complete flow
- frontend mock or live gates fail
- backend lint, tests, or security checks fail
- staging smoke or release preflight fails
- payment or upload flows regress
- monitoring and alerting are not active for the pilot window
