# Architecture - Secure Travel Booking Platform

## 1. Overview

Secure Travel Booking Platform is a security-focused backend built with:

- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Alembic
- Redis
- Nginx
- Docker Compose

The project is designed as a travel booking backend with explicit hardening around
authentication, payments, file uploads, auditing, and runtime operations.

## 2. High-Level Architecture

```text
Client / Browser / API Consumer
            |
            | HTTPS / HTTP
            v
         Nginx Proxy
            |
            v
      FastAPI Application
            |
            +--> Auth / RBAC
            +--> Booking Logic
            +--> Coupon Logic
            +--> Payment Logic
            +--> Upload Logic
            +--> Admin Monitoring
            +--> Runtime Maintenance
            |
            +--> PostgreSQL
            |     +--> users
            |     +--> bookings
            |     +--> payments
            |     +--> coupons
            |     +--> uploaded_documents
            |     +--> audit_logs
            |     +--> security_events
            |     +--> outbox_events
            |
            +--> Redis
                  +--> rate limiting
                  +--> notification backend (optional)
```

## 3. Runtime Notes

- Reverse-proxy deployments should enable forwarded headers and restrict trusted proxy IPs.
- Outbox events are persisted in PostgreSQL and drained by the runtime maintenance loop.
- Health and metrics endpoints expose basic readiness and operational state.
