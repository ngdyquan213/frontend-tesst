# Entity Relationship Diagram (ERD) - Secure Travel Booking Platform

## 1. Overview

Tài liệu này mô tả các thực thể dữ liệu chính và quan hệ giữa chúng trong Secure Travel Booking Platform.

## 2. Main Entities

### Identity & Access

#### users
Lưu thông tin tài khoản người dùng.

Các cột chính:
- id
- email
- username
- password_hash
- full_name
- phone
- status
- email_verified
- phone_verified
- last_login_at
- last_login_ip
- failed_login_count
- locked_until
- deleted_at
- created_at
- updated_at

#### roles
Lưu vai trò hệ thống.

Các cột chính:
- id
- name
- description
- created_at

#### user_roles
Bảng nối users và roles.

Các cột chính:
- user_id
- role_id
- assigned_at
- assigned_by

#### refresh_tokens
Refresh token của user.

#### password_reset_tokens
Password reset token của user.

#### login_attempts
Log các lần login thành công/thất bại.

### Travel Inventory

#### airlines
Thông tin hãng bay.

#### airports
Thông tin sân bay.

#### flights
Thông tin chuyến bay.

Khóa ngoại:
- airline_id -> airlines.id
- departure_airport_id -> airports.id
- arrival_airport_id -> airports.id

#### hotels
Thông tin khách sạn.

#### hotel_rooms
Thông tin loại phòng.

Khóa ngoại:
- hotel_id -> hotels.id

### Booking Domain

#### bookings
Thực thể booking trung tâm.

Khóa ngoại:
- user_id -> users.id
- coupon_id -> coupons.id (nullable)

Các thuộc tính chính:
- booking_code
- status
- total_base_amount
- total_discount_amount
- total_final_amount
- currency
- payment_status
- booked_at
- expires_at
- cancelled_at

#### booking_items
Chi tiết item trong booking.

Khóa ngoại:
- booking_id -> bookings.id
- flight_id -> flights.id (nullable)
- hotel_room_id -> hotel_rooms.id (nullable)

Một booking có thể chứa:
- flight item
- hotel item
- tour item

#### travelers
Thông tin traveler/guest liên quan booking.

Khóa ngoại:
- booking_id -> bookings.id

### Coupon Domain

#### coupons
Thông tin coupon.

Khóa ngoại:
- created_by -> users.id (nullable)

Các thuộc tính chính:
- code
- coupon_type
- applicable_product_type
- discount_value
- max_discount_amount
- min_booking_amount
- usage_limit_total
- usage_limit_per_user
- used_count
- starts_at
- expires_at
- is_active

#### coupon_usages
Bản ghi coupon đã dùng.

Khóa ngoại:
- coupon_id -> coupons.id
- user_id -> users.id
- booking_id -> bookings.id

### Payment Domain

#### payments
Thông tin payment cho booking.

Khóa ngoại:
- booking_id -> bookings.id
- initiated_by -> users.id (nullable)

Các thuộc tính chính:
- payment_method
- status
- amount
- currency
- gateway_order_ref
- gateway_transaction_ref
- idempotency_key
- paid_at
- failed_at
- failure_reason

#### payment_transactions
Lịch sử sự kiện payment.

Khóa ngoại:
- payment_id -> payments.id

#### payment_callbacks
Lịch sử callback gateway.

Khóa ngoại:
- payment_id -> payments.id (nullable)

Các thuộc tính chính:
- gateway_name
- callback_payload
- signature_valid
- processed
- received_at
- source_ip

### Document & Async Domain

#### uploaded_documents
Metadata tài liệu người dùng upload.

Khóa ngoại:
- user_id -> users.id
- booking_id -> bookings.id (nullable)
- traveler_id -> travelers.id (nullable)

Các thuộc tính chính:
- document_type
- original_filename
- stored_filename
- mime_type
- file_size
- storage_bucket
- storage_key
- checksum_sha256
- is_private
- uploaded_at
- deleted_at

#### outbox_events
Hàng đợi side effect bền vững cho email/notification.

Các thuộc tính chính:
- target
- handler
- payload
- status
- attempt_count
- available_at
- claim_token
- claimed_by
- processing_started_at
- lease_expires_at
- processed_at
- last_error

### Monitoring & Security

#### audit_logs
Log hành động hệ thống / user / admin / service.

Khóa ngoại:
- actor_user_id -> users.id (nullable)

Các thuộc tính chính:
- actor_type
- action
- resource_type
- resource_id
- ip_address
- user_agent
- request_id
- metadata
- created_at

#### security_events
Sự kiện an ninh.

Khóa ngoại:
- related_user_id -> users.id (nullable)

Các thuộc tính chính:
- event_type
- severity
- ip_address
- title
- description
- event_data
- detected_at

#### app_settings
Cấu hình hệ thống.

Khóa ngoại:
- updated_by -> users.id (nullable)

## 3. Relationship Summary

### User Relationships

- `users` 1 -> N `bookings`
- `users` 1 -> N `coupon_usages`
- `users` 1 -> N `uploaded_documents`
- `users` 1 -> N `audit_logs`
- `users` 1 -> N `security_events`
- `users` 1 -> N `payments` (initiated_by)
- `users` N -> N `roles` qua `user_roles`

### Booking Relationships

- `bookings` 1 -> N `booking_items`
- `bookings` 1 -> N `travelers`
- `bookings` 1 -> N `payments`
- `bookings` 1 -> N `uploaded_documents`
- `bookings` 0..1 -> 1 `coupons`
- `bookings` 1 -> N `coupon_usages`

### Payment & Async Relationships

- `payments` 1 -> N `payment_transactions`
- `payments` 1 -> N `payment_callbacks`
- `outbox_events` lưu side effects hậu commit, không khóa ngoại trực tiếp tới nghiệp vụ

## 4. Text ERD View

```text
users ---< user_roles >--- roles
users ---< bookings
users ---< coupon_usages
users ---< uploaded_documents
users ---< audit_logs
users ---< security_events
users ---< payments (initiated_by)

airlines ---< flights
airports ---< flights (departure)
airports ---< flights (arrival)

hotels ---< hotel_rooms

bookings ---< booking_items
bookings ---< travelers
bookings ---< payments
bookings ---< coupon_usages
bookings ---< uploaded_documents
coupons ---< bookings
coupons ---< coupon_usages

flights ---< booking_items
hotel_rooms ---< booking_items

payments ---< payment_transactions
payments ---< payment_callbacks

travelers ---< uploaded_documents
```
