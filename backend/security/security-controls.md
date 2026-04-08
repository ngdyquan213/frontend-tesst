# Security Controls - Secure Travel Booking Platform

## Authentication and Authorization

### Implemented

- Password hashing and JWT-based authentication
- Dependency-based route protection for authenticated users and admins
- Ownership checks for bookings, payments, and uploaded documents
- Refresh-token rotation and revocation flows

### Mocked

- No external identity provider or SSO integration

### Planned

- Centralized secret-backed credential rotation for non-local environments

## Payment Security

### Implemented

- Idempotency key enforcement on payment initiation
- Callback signature verification
- Callback replay detection
- Amount and currency mismatch rejection
- Callback source allowlist using IP/CIDR matching
- Security event logging for suspicious callback activity
- Structured payment logs and callback failure metrics

### Mocked

- Gateway integration remains simulated; callback signing is internal to the app

### Planned

- Live gateway SDK integration and provider-origin verification beyond IP allowlists

## File and Upload Security

### Implemented

- Extension allowlist
- MIME allowlist
- File-signature validation
- Ownership enforcement on document download
- Audit logging for upload/download actions
- Optional malware scanning hook with `mock` and `clamav` backends

### Mocked

- Default local development uses mock malware scanning unless a ClamAV service is configured

### Planned

- Presigned object-storage download/upload flows
- Quarantine bucket and asynchronous malware triage workflow

## Observability and Operations

### Implemented

- Request logging with request IDs
- Structured logs for payment and outbox processing
- Audit logs for sensitive business actions
- Security events for suspicious activity
- Health endpoints
- Basic metrics for request count, error count, payment callback failures, and outbox backlog
- Outbox backlog tracking during runtime maintenance
- Runtime task state in readiness responses
- Rate-limit backend degradation metrics

### Mocked

- Metrics are in-process counters exposed as JSON, not a full external telemetry pipeline

### Planned

- Prometheus/OpenTelemetry export
- Centralized log shipping and alerting rules

## Platform Edge and Secrets

### Implemented

- Trusted host and CORS controls
- Forwarded IP configuration
- Payment callback source allowlist required in staging/production
- Startup warning when staging/production still uses environment-file secret sourcing

### Mocked

- Secrets are still loaded from environment variables/examples in the current repo

### Planned

- Managed secret store integration for staging/production
- Reverse-proxy or WAF policy hardening
