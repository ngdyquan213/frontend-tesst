.PHONY: install dev migrate makemigrations seed seed-coupons seed-demo create-admin test test-cov lint security up down logs restart up-test-db down-test-db test-postgres runtime-check smoke-local up-staging down-staging logs-staging smoke-staging up-production down-production logs-production smoke-production release-preflight release-verify-demo

install:
	pip install --upgrade pip==25.2
	pip install -r requirements-dev.lock
	pip install --no-deps -e .

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="${FORWARDED_ALLOW_IPS:-127.0.0.1,::1}"

migrate:
	alembic upgrade head

makemigrations:
	alembic revision --autogenerate -m "$(m)"

seed:
	python scripts/seed_data.py

seed-coupons:
	python scripts/seed_coupons.py

seed-demo:
	python -m scripts.seed_demo_environment

create-admin:
	python scripts/create_admin.py

test:
	python -m pytest -q

test-cov:
	python -m pytest --cov=app --cov-report=term-missing -q

test-fast:
	python -m pytest -q tests/test_config_validation.py tests/test_health_endpoints.py tests/test_runtime_tasks.py tests/test_request_context.py

lint:
	ruff check app tests scripts

security:
	bandit -r app -x tests
	pip-audit

up:
	docker compose -f infra/docker/docker-compose.yml up -d --build

down:
	docker compose -f infra/docker/docker-compose.yml down

logs:
	docker compose -f infra/docker/docker-compose.yml logs -f

restart:
	docker compose -f infra/docker/docker-compose.yml restart

up-test-db:
	docker compose -f infra/docker/docker-compose.test.yml up -d

down-test-db:
	docker compose -f infra/docker/docker-compose.test.yml down

test-postgres:
	TEST_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5433/secure_travel_booking_test python -m pytest -q -m postgres tests/test_postgres_smoke.py tests/test_postgres_coupon_json.py

runtime-check:
	python -c "from app.core.startup import run_startup_checks; run_startup_checks()"

smoke-local:
	python scripts/smoke_local_stack.py --expected-environment development

up-staging:
	docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml up -d --build

down-staging:
	docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml down

logs-staging:
	docker compose --env-file .env.staging -f infra/docker/docker-compose.staging.yml logs -f

smoke-staging:
	python scripts/smoke_local_stack.py --base-url $${SMOKE_BASE_URL:-http://localhost:$${HOST_HTTP_PORT:-8080}} --prometheus-url $${SMOKE_PROMETHEUS_URL:-http://localhost:$${HOST_PROMETHEUS_PORT:-9090}} --expected-environment staging

up-production:
	docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml up -d --build

down-production:
	docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml down

logs-production:
	docker compose --env-file .env.production -f infra/docker/docker-compose.production.yml logs -f

smoke-production:
	python scripts/smoke_local_stack.py --base-url $${SMOKE_BASE_URL:-http://localhost:$${HOST_HTTP_PORT:-8081}} --expected-environment production

release-preflight:
	python scripts/release_preflight.py --env-file $${APP_ENV_FILE:-.env.production} --check-local-files

release-verify-demo:
	python scripts/release_verify_demo.py --base-url $${RELEASE_BASE_URL:-http://localhost:8081/api/v1}
