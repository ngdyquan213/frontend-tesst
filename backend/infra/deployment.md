Deployment artifacts live under `infra/docker` and `infra/nginx`.

Primary references:

- `docs/deployment.md` for development, test, staging, and production bring-up
- `docs/migration-runbook.md` for schema rollout and rollback expectations
- `infra/observability/prometheus.yml` and `infra/observability/alerts.yml` for the staging observability baseline

Current state:

- development stack is supported
- test database compose stack is supported
- staging-like compose stack is supported, including Prometheus scrape, alert rules, and a dedicated migration job
- production app-layer compose stack is supported against external dependencies, with dedicated migrations and optional built-in TLS termination
- full cloud deployment automation is not yet implemented in this repository
