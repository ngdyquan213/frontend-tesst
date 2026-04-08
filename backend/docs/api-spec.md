# API Spec - Frontend Phase 1

## 1. Scope

Tài liệu này chốt contract tối thiểu cho frontend phase 1 và QA smoke flow.

Base URL:

- local API trực tiếp: `http://localhost:8000/api/v1`
- local qua Nginx: `http://localhost/api/v1`
- staging compose mặc định: `http://localhost:8080/api/v1`

Auth:

- protected routes dùng header `Authorization: Bearer <access_token>`
- payment initiate dùng thêm `Idempotency-Key`

Nguồn truth bổ sung:

- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`
- curl examples: `docs/api-examples.md`

## 2. Standard Error Envelope

Mọi lỗi chuẩn của app đều trả về cùng shape:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Booking not found",
  "detail": "Booking not found",
  "timestamp": "2026-03-15T14:30:00.000000+00:00",
  "path": "/api/v1/payments/initiate"
}
```

Các `error_code` thường gặp:

- `REQUEST_VALIDATION_ERROR`
- `VALIDATION_ERROR`
- `AUTHENTICATION_ERROR`
- `AUTHORIZATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMIT_EXCEEDED`
- `RATE_LIMIT_UNAVAILABLE`
- `INTERNAL_SERVER_ERROR`

Validation lỗi schema dùng:

```json
{
  "error_code": "REQUEST_VALIDATION_ERROR",
  "message": "Request validation failed",
  "detail": {
    "errors": [
      {
        "loc": ["body", "password"],
        "msg": "String should have at least 8 characters",
        "type": "string_too_short"
      }
    ]
  },
  "timestamp": "2026-03-15T14:30:00.000000+00:00",
  "path": "/api/v1/auth/login"
}
```

## 3. Auth

### `POST /auth/register`

Request:

```json
{
  "email": "alice@example.com",
  "username": "alice",
  "full_name": "Alice Nguyen",
  "password": "Password123"
}
```

Response `201`:

```json
{
  "id": "f4a3c7f8-2c50-4ce8-a8bc-0bf94fb2085a",
  "email": "alice@example.com",
  "username": "alice",
  "full_name": "Alice Nguyen",
  "status": "active",
  "email_verified": false,
  "created_at": "2026-03-15T14:30:00.000000Z"
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "alice@example.com",
  "password": "Password123"
}
```

Response `200`:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

Failure example `401`:

```json
{
  "error_code": "AUTHENTICATION_ERROR",
  "message": "Invalid email or password",
  "detail": "Invalid email or password",
  "timestamp": "2026-03-15T14:30:00.000000+00:00",
  "path": "/api/v1/auth/login"
}
```

### `POST /auth/refresh`

Request:

```json
{
  "refresh_token": "<jwt>"
}
```

Response `200`:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<new-jwt>",
  "token_type": "bearer"
}
```

### `POST /auth/logout`

Request:

```json
{
  "refresh_token": "<jwt>"
}
```

Response `200`:

```json
{
  "message": "Logged out successfully"
}
```

### `POST /auth/logout-all`

Response `200`:

```json
{
  "message": "Logged out from all sessions successfully"
}
```

## 4. User Profile

### `GET /users/me`

Response `200`:

```json
{
  "id": "f4a3c7f8-2c50-4ce8-a8bc-0bf94fb2085a",
  "email": "alice@example.com",
  "username": "alice",
  "full_name": "Alice Nguyen",
  "status": "active"
}
```

## 5. Catalog Read APIs

Frontend phase 1 có thể dùng:

- `GET /flights`
- `GET /hotels`
- `GET /tours`

Các response đều trả danh sách object đã serialize enum thành string. Với schema dài hơn, ưu tiên generate client từ `/openapi.json`.

## 6. Booking

### `POST /bookings`

Request:

```json
{
  "flight_id": "flight-uuid",
  "quantity": 2
}
```

Response `201`:

```json
{
  "id": "booking-uuid",
  "booking_code": "BK-7F5A1D91E2",
  "user_id": "user-uuid",
  "status": "pending",
  "total_base_amount": "2400000.00",
  "total_discount_amount": "0.00",
  "total_final_amount": "2400000.00",
  "currency": "VND",
  "payment_status": "pending",
  "booked_at": "2026-03-15T14:30:00.000000Z"
}
```

### `POST /bookings/hotels`

Request:

```json
{
  "hotel_room_id": "room-uuid",
  "check_in_date": "2026-04-10",
  "check_out_date": "2026-04-12",
  "quantity": 1
}
```

### `POST /bookings/tours`

Request:

```json
{
  "tour_schedule_id": "schedule-uuid",
  "adult_count": 2,
  "child_count": 1,
  "infant_count": 0
}
```

### `GET /bookings?page=1&page_size=20`

Response `200`:

```json
{
  "items": [
    {
      "id": "booking-uuid",
      "booking_code": "BK-7F5A1D91E2",
      "user_id": "user-uuid",
      "status": "pending",
      "total_base_amount": "2400000.00",
      "total_discount_amount": "0.00",
      "total_final_amount": "2400000.00",
      "currency": "VND",
      "payment_status": "pending",
      "booked_at": "2026-03-15T14:30:00.000000Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1,
  "total_pages": 1
}
```

## 7. Payment

### `POST /payments/initiate`

Headers:

- `Authorization: Bearer <access_token>`
- `Idempotency-Key: booking-uuid-v1`

Request:

```json
{
  "booking_id": "booking-uuid",
  "payment_method": "vnpay"
}
```

Response `201`:

```json
{
  "id": "payment-uuid",
  "booking_id": "booking-uuid",
  "payment_method": "vnpay",
  "status": "pending",
  "amount": "2400000.00",
  "currency": "VND",
  "gateway_order_ref": "PAY-BK-7F5A1D91E2-booking-uuid-v1",
  "gateway_transaction_ref": null,
  "paid_at": null
}
```

Failure example `409` khi reuse idempotency key sai tham số:

```json
{
  "error_code": "CONFLICT",
  "message": "Idempotency key was already used with different payment parameters",
  "detail": "Idempotency key was already used with different payment parameters",
  "timestamp": "2026-03-15T14:30:00.000000+00:00",
  "path": "/api/v1/payments/initiate"
}
```

### `GET /payments/booking/{booking_id}`

Response `200` khi đã có payment:

```json
{
  "booking_id": "booking-uuid",
  "booking_payment_status": "pending",
  "payment": {
    "id": "payment-uuid",
    "booking_id": "booking-uuid",
    "payment_method": "vnpay",
    "status": "pending",
    "amount": "2400000.00",
    "currency": "VND",
    "gateway_order_ref": "PAY-BK-7F5A1D91E2-booking-uuid-v1",
    "gateway_transaction_ref": null,
    "paid_at": null
  }
}
```

Response `200` khi booking không tồn tại hoặc user không sở hữu booking:

```json
{
  "booking_id": "booking-uuid",
  "booking_payment_status": "not_found",
  "payment": null
}
```

### `POST /payments/callback`

Request:

```json
{
  "gateway_name": "mock_vnpay",
  "gateway_order_ref": "PAY-BK-7F5A1D91E2-booking-uuid-v1",
  "gateway_transaction_ref": "TX-123456",
  "amount": "2400000.00",
  "currency": "VND",
  "status": "success",
  "signature": "<signed-hash>"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Payment callback processed",
  "id": "payment-uuid",
  "booking_id": "booking-uuid",
  "payment_method": "vnpay",
  "status": "paid",
  "amount": "2400000.00",
  "currency": "VND",
  "gateway_order_ref": "PAY-BK-7F5A1D91E2-booking-uuid-v1",
  "gateway_transaction_ref": "TX-123456",
  "paid_at": "2026-03-15T14:35:00.000000Z"
}
```

Failure example `400`:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid callback signature",
  "detail": "Invalid callback signature",
  "timestamp": "2026-03-15T14:35:00.000000+00:00",
  "path": "/api/v1/payments/callback"
}
```

## 8. Uploads

### `POST /uploads/documents`

Content type:

- `multipart/form-data`

Form fields:

- `file`: binary
- `document_type`: enum string
- `booking_id`: optional
- `traveler_id`: optional

Successful response `201`:

```json
{
  "id": "document-uuid",
  "user_id": "user-uuid",
  "booking_id": "booking-uuid",
  "traveler_id": null,
  "document_type": "passport",
  "original_filename": "passport.pdf",
  "mime_type": "application/pdf",
  "file_size": 24518,
  "storage_bucket": "local",
  "is_private": true,
  "uploaded_at": "2026-03-15T14:40:00.000000Z"
}
```

Failure example `400`:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "File content does not match declared MIME type",
  "detail": "File content does not match declared MIME type",
  "timestamp": "2026-03-15T14:40:00.000000+00:00",
  "path": "/api/v1/uploads/documents"
}
```

### `GET /uploads/documents`

Response `200`:

```json
[
  {
    "id": "document-uuid",
    "user_id": "user-uuid",
    "booking_id": "booking-uuid",
    "traveler_id": null,
    "document_type": "passport",
    "original_filename": "passport.pdf",
    "mime_type": "application/pdf",
    "file_size": 24518,
    "storage_bucket": "local",
    "is_private": true,
    "uploaded_at": "2026-03-15T14:40:00.000000Z"
  }
]
```

### `GET /uploads/documents/{document_id}/download`

Response:

- `200` với file binary
- `404` nếu document không thuộc user hoặc file vật lý không còn tồn tại

## 9. Health And Ops

### `GET /health/ready`

Response `200` hoặc `503` với các field chính:

- `checks.database`
- `checks.redis`
- `checks.storage`
- `checks.outbox`
- `checks.rate_limit_backend`
- `readiness_policy.outbox_mode`
- `degraded_checks`
- `runtime_tasks`
- `observability.rate_limit_backend_failures_total`

Ví dụ degraded nhưng vẫn `200` khi outbox ở chế độ best-effort:

```json
{
  "status": "ready",
  "service": "Secure Travel Booking Platform",
  "environment": "development",
  "readiness_policy": {
    "outbox_mode": "best_effort"
  },
  "checks": {
    "database": true,
    "redis": true,
    "storage": true,
    "outbox": false,
    "rate_limit_backend": true
  },
  "degraded_checks": ["outbox"]
}
```

### `GET /metrics`

Response là JSON snapshot, tối thiểu gồm:

- `http_requests_total`
- `http_error_responses_total`
- `payment_callback_failures_total`
- `payment_callback_failures_by_reason`
- `outbox_backlog`
- `outbox_dispatch_failures_total`
- `outbox_dispatch_failures_by_reason`
- `outbox_last_dispatch_status`
- `rate_limit_backend_failures_total`

## 10. Frontend Notes

- Tất cả enum trong JSON response đã được map thành string.
- Decimal có thể được serialize thành string; frontend nên parse an toàn cho tiền tệ.
- `bookings`, `payments`, `uploads` là các flow phase 1 đã có test coverage tốt trong repo.
- Với các schema dài như `flights`, `hotels`, `tours`, ưu tiên generate client từ `/openapi.json` để tránh drift.
