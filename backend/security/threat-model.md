# Threat Model - Secure Travel Booking Platform

## 1. Overview

Secure Travel Booking Platform là backend API phục vụ:

- đăng ký và đăng nhập người dùng
- đặt vé máy bay, khách sạn và tour
- áp mã giảm giá
- khởi tạo thanh toán và xử lý callback thanh toán
- upload và download tài liệu du lịch
- monitoring và quản trị qua admin APIs

## 2. Main Assets

Các tài sản cần bảo vệ:

- tài khoản người dùng
- access token và refresh token
- dữ liệu booking và traveler
- trạng thái thanh toán và transaction reference
- tài liệu đã upload
- audit logs và security events
- coupon rules và usage limits
- admin-only APIs

## 3. Trust Boundaries

### Boundary A - External Client to API

Người dùng internet gọi API qua HTTP(S).

Rủi ro:

- brute force
- token theft
- broken authentication
- injection
- IDOR
- abusive requests

### Boundary B - API to Database

FastAPI backend truy cập PostgreSQL.

Rủi ro:

- unsafe query logic
- privilege abuse
- inconsistent transaction handling
- broken authorization dẫn tới đọc/ghi trái phép

### Boundary C - API to File Storage

Document upload/download hiện có thể dùng local storage hoặc S3-compatible storage.

Rủi ro:

- path traversal
- unsafe file types
- insecure direct file access
- unauthorized file download

### Boundary D - Payment Gateway Callback to API

Payment gateway mock callback gọi `/api/v1/payments/callback`.

Rủi ro:

- forged callback
- replay callback
- amount mismatch
- fake paid status
- duplicate transaction reference

### Boundary E - Admin to Admin APIs

Admin thực hiện read/update coupon lifecycle, monitoring và export.

Rủi ro:

- privilege escalation
- missing role checks
- admin token misuse
- thiếu auditability

## 4. Main Threat Scenarios

### 4.1 Authentication Threats

#### Threat: Brute-force login

Impact:

- account takeover

Current mitigations:

- login attempt logging
- security event generation
- password hashing
- JWT-based auth
- temporary account lockout
- Redis-backed rate limiting

Gaps:

- distributed brute-force intelligence chưa có

#### Threat: Stolen JWT token

Impact:

- account misuse
- truy cập booking, document hoặc admin APIs

Current mitigations:

- bearer token validation
- protected endpoints với `get_current_user`
- admin endpoints yêu cầu `require_admin`
- refresh token rotation và revocation

Gaps:

- access token revocation chưa có
- session/device intelligence còn cơ bản

### 4.2 Authorization Threats

#### Threat: IDOR on document download

Impact:

- lộ tài liệu nhạy cảm

Current mitigations:

- `get_by_id_and_user_id`
- ownership check trước khi download
- audit log khi truy cập tài liệu

Status:

- mitigated trong implementation hiện tại

#### Threat: User accesses another user's booking/payment

Impact:

- privacy leak
- unauthorized actions

Current mitigations:

- booking lookup theo `(booking_id, user_id)`
- payment lookup thông qua owned booking checks

Status:

- mitigated với ownership checks và callback persistence hiện tại

### 4.3 Booking / Inventory Threats

#### Threat: Overbooking race condition

Impact:

- negative inventory
- inconsistent booking state

Current mitigations:

- row locking kiểu `SELECT ... FOR UPDATE`
- transaction bao quanh booking creation
- inventory update trong cùng transaction

Status:

- mitigated cho model inventory hiện tại

#### Threat: Booking manipulation

Impact:

- sai tổng tiền
- coupon abuse
- invalid state transitions

Current mitigations:

- tổng tiền tính server-side
- coupon validation rules
- payment status cập nhật server-side

### 4.4 Coupon Threats

#### Threat: Coupon abuse / repeated use

Impact:

- financial loss

Current mitigations:

- `usage_limit_total`
- `usage_limit_per_user`
- booking ownership check
- one coupon per booking
- coupon usage record

Gaps:

- abuse analytics chưa có
- admin anomaly dashboard chưa đủ sâu

### 4.5 Payment Threats

#### Threat: Forged callback

Impact:

- payment bị đánh dấu paid mà không có giao dịch thật

Current mitigations:

- mock HMAC signature verification
- callback persistence
- callback source allowlist theo IP/CIDR
- security event khi signature invalid

Status:

- mitigated ở mức mock gateway

#### Threat: Replay callback

Impact:

- duplicate processing
- inconsistent payment state

Current mitigations:

- unique transaction reference persistence
- replay detection
- security event logging

Status:

- mitigated cho current callback model, nhưng chưa đạt trust model production

#### Threat: Amount mismatch

Impact:

- underpayment được chấp nhận

Current mitigations:

- compare amount/currency với payment record
- reject mismatched callback
- record security event

Status:

- mitigated

### 4.6 File Upload Threats

#### Threat: Malicious file upload

Impact:

- storage abuse
- malware hosting
- parser exploitation

Current mitigations:

- extension allowlist
- MIME allowlist
- file-signature validation
- optional malware scanning với `mock` và `clamav`
- ownership-based retrieval

Gaps:

- production malware operations chưa hoàn chỉnh
- quarantine/triage flow chưa có
- object storage workflow chưa hoàn tất

### 4.7 Admin Threats

#### Threat: Missing admin enforcement

Impact:

- user thường truy cập monitoring hoặc management surfaces

Current mitigations:

- `require_admin`
- role-based check
- audit log cho admin actions

Gaps:

- chưa có fine-grained permission matrix

## 5. STRIDE Mapping

### Spoofing

- forged JWT
- fake payment callback
- admin impersonation

### Tampering

- coupon rule manipulation
- payment state tampering
- booking price tampering
- file replacement

### Repudiation

- deny admin action
- deny payment processing
- deny document access

Mitigations:

- audit logs
- security events
- request logging with request id

### Information Disclosure

- document leakage
- user/booking data leakage
- admin audit exposure

### Denial of Service

- brute-force login
- upload abuse
- callback spam
- API flooding

Mitigations:

- Redis-backed shared rate limiting
- fail-closed cho login, refresh, upload và payment callback nếu rate-limit backend lỗi

### Elevation of Privilege

- user to admin escalation
- IDOR dẫn tới cross-user access

## 6. Highest-Risk Areas

1. Payment callback handling
2. Document upload/download
3. Admin APIs
4. Booking inventory race conditions
5. Coupon abuse logic

## 7. Security Priorities

### Near-term

- đồng bộ docs với implementation hiện tại
- concurrency test cho cancel/refund/admin transitions
- tiếp tục giữ request path ở chế độ enqueue-only cho side effects
- mở rộng admin action tests
- bổ sung callback negative tests theo trust model gần production hơn

### Mid-term

- AV scanning operations cho upload
- background workers/outbox hardening
- centralized authorization policy
- callback timestamp window và nonce validation

### Longer-term

- object storage presigned URL model
- SIEM / alerting integration
- anomaly detection cho coupon/payment abuse
