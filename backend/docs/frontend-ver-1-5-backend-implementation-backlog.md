# Frontend Ver 1.5 Backend Implementation Backlog

## 1. Mục tiêu

Backlog này là bản triển khai thực dụng của tài liệu:

- [frontend-ver-1-5-backend-upgrade-plan.md](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/docs/frontend-ver-1-5-backend-upgrade-plan.md)

Nó trả lời 4 câu hỏi cho từng workstream:

- cần migration DB nào
- cần thêm hoặc sửa route/service/repository/schema nào
- có thể tái sử dụng phần nào của backend hiện tại
- cần viết test gì để chốt contract

## 2. Quy ước đọc backlog

- `Add`: file mới nên tạo
- `Update`: file hiện có nên sửa
- `Reuse`: phần backend hiện có nên tận dụng
- `Done when`: điều kiện xem workstream đã xong

## 3. Mức ưu tiên

### P0 - Bắt buộc để tiến tới `9.0/10`

- auth recovery + profile mutation
- saved travelers
- canonical documents + admin document review
- refunds resource user-side
- support tickets
- notifications inbox
- promotions read API
- booking detail
- payment detail/status cleanup
- vouchers read model

### P1 - Bắt buộc để tiến tới `9.5/10`

- admin operations read model
- compatibility aliases cho route cũ
- OpenAPI/examples đầy đủ cho domain mới
- contract tests frontend/backend
- permissions seed cho role mới

### P2 - Hardening

- rate limit
- retry policy
- observability
- richer audit trail
- migration/backfill tooling

## 4. Sprint Gợi Ý

### Sprint 1

- auth recovery
- profile update/change-password
- booking detail
- payment detail/status cleanup
- vouchers read model

### Sprint 2

- saved travelers
- documents canonical API
- admin documents review
- refunds user API

### Sprint 3

- support tickets
- notifications inbox
- promotions read API
- admin operations read model

### Sprint 4

- compatibility aliases cleanup
- OpenAPI/examples
- contract tests
- seed/permissions hardening

## 5. Workstream A - Auth Recovery And Profile Mutation

### Current state

- `PasswordResetToken` model đã tồn tại trong [user.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/user.py)
- auth service hiện mới có register/login/refresh/logout
- user service hiện chỉ có get profile

### Migration DB

- Optional migration nếu cần hardening thêm:
  - thêm index cho `password_reset_tokens.expires_at`
  - thêm audit metadata nếu muốn

### Files

- `Update` [backend/app/schemas/auth.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/auth.py)
  - thêm `ForgotPasswordRequest`
  - thêm `ResetPasswordRequest`
  - thêm `PasswordResetResponse` hoặc dùng `MessageResponse`
- `Update` [backend/app/schemas/user.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/user.py)
  - thêm `UserUpdateRequest`
  - thêm `ChangePasswordRequest`
- `Update` [backend/app/repositories/user_repository.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/repositories/user_repository.py)
  - create/find/use password reset token
  - profile update helpers
  - password update helpers
- `Update` [backend/app/services/auth_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/auth_service.py)
  - forgot password flow
  - reset password flow
- `Update` [backend/app/services/user_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/user_service.py)
  - update profile
  - change password
- `Update` [backend/app/api/v1/auth.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/auth.py)
  - add `/forgot-password`
  - add `/reset-password`
- `Update` [backend/app/api/v1/users.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/users.py)
  - add `PATCH /me`
  - add `POST /me/change-password`

### Reuse

- [backend/app/models/user.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/user.py)
- [backend/app/services/auth_token_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/auth_token_service.py)
- [backend/app/services/audit_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/audit_service.py)
- outbox/email worker đang có sẵn

### Tests

- `Add` `backend/tests/test_auth_password_reset.py`
- `Add` `backend/tests/test_user_profile_mutation.py`
- cover:
  - forgot password always returns safe response
  - reset token hết hạn
  - reset token dùng lại bị từ chối
  - đổi password yêu cầu password cũ đúng
  - refresh token/session handling sau reset password

### Done when

- frontend auth/account pages không còn phải fake forgot/reset/change password

## 6. Workstream B - Saved Travelers

### Current state

- backend hiện chỉ có traveler theo booking qua [booking_travelers.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/booking_travelers.py)
- chưa có traveler profiles cấp user

### Migration DB

- `Add` Alembic migration: `add_saved_travelers_table.py`
- bảng đề xuất:
  - `saved_travelers`
  - `id`
  - `user_id`
  - `full_name`
  - `date_of_birth`
  - `passport_number`
  - `nationality`
  - `document_type`
  - `is_default`
  - timestamps

### Files

- `Add` `backend/app/models/traveler_profile.py`
- `Update` [backend/app/models/__init__.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/__init__.py)
- `Add` `backend/app/repositories/traveler_profile_repository.py`
- `Add` `backend/app/schemas/traveler_profile.py`
- `Add` `backend/app/services/traveler_profile_service.py`
- `Add` `backend/app/api/v1/travelers.py`
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)

### Reuse

- [backend/app/schemas/traveler.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/traveler.py) cho field semantics
- [backend/app/services/traveler_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/traveler_service.py) cho validation pattern
- [backend/app/repositories/booking_repository.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/repositories/booking_repository.py) cho relation snapshot nếu cần

### Tests

- `Add` `backend/tests/test_saved_travelers.py`
- cover:
  - list/create/update/delete saved traveler
  - user A không đọc/sửa traveler của user B
  - default traveler behavior nếu có
  - copy from saved traveler into booking flow nếu chọn làm sau

### Done when

- frontend `TravelersPage` có API thật cho CRUD account-level

## 7. Workstream C - Canonical Documents API

### Current state

- backend có `uploads` API kỹ thuật
- model [UploadedDocument](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/document.py) chưa đủ review workflow cho admin/frontend `documents`

### Migration DB

- `Add` Alembic migration: `add_document_review_fields.py`
- thêm fields đề xuất vào `uploaded_documents`:
  - `status`
  - `reviewed_at`
  - `reviewed_by`
  - `rejection_reason`

### Files

- `Update` [backend/app/models/document.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/document.py)
- `Update` [backend/app/schemas/document.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/document.py)
  - add detail/review request-response schemas
- `Update` [backend/app/repositories/document_repository.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/repositories/document_repository.py)
  - list/detail/delete/review helpers
- `Add` `backend/app/services/document_service.py`
- `Add` `backend/app/services/admin_document_service.py`
- `Add` `backend/app/api/v1/documents.py`
- `Add` `backend/app/api/v1/admin_documents.py`
- `Update` [backend/app/api/v1/uploads.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/uploads.py)
  - keep as compatibility alias or thin wrapper
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)

### Reuse

- [backend/app/services/upload_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/upload_service.py)
- [backend/app/services/malware_scan_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/malware_scan_service.py)
- [backend/app/repositories/document_repository.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/repositories/document_repository.py)

### Tests

- `Add` `backend/tests/test_documents_api.py`
- `Add` `backend/tests/test_admin_documents.py`
- cover:
  - user list/detail/download/delete
  - delete policy
  - admin approve/reject
  - user cannot access foreign document
  - status transition rules

### Done when

- frontend `DocumentsPage`, `DocumentDetailPage`, admin document review đều có API thật

## 8. Workstream D - Refunds As A First-Class Resource

### Current state

- refund logic hiện đi qua booking cancellation
- có model refund nhưng chưa có user-facing refunds API canonical

### Migration DB

- No mandatory new table if current refund model đủ dùng
- Optional migration nếu cần:
  - add user-facing timeline/status metadata
  - add review notes

### Files

- `Add` `backend/app/repositories/refund_repository.py`
- `Add` `backend/app/schemas/refund.py`
- `Add` `backend/app/services/refund_service.py`
- `Add` `backend/app/api/v1/refunds.py`
- `Update` [backend/app/services/booking_cancellation_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/booking_cancellation_service.py)
  - align cancellation output with refund resource
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)

### Reuse

- [backend/app/models/refund.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/refund.py)
- [backend/app/api/v1/booking_cancellations.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/booking_cancellations.py)
- [backend/app/api/v1/admin_refunds.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/admin_refunds.py)

### Tests

- `Add` `backend/tests/test_refunds_api.py`
- cover:
  - create/list/detail refund
  - refund visibility by owner
  - link between cancellation and refund
  - admin update reflected in user refund detail

### Done when

- frontend refund pages không còn phải suy diễn từ bookings list

## 9. Workstream E - Booking Detail, Payment Detail, Voucher Read Model

### Current state

- booking list/create đã có
- payment initiate/status-by-booking đã có
- booking voucher đã có nhưng thiên về booking-scoped

### Migration DB

- Không bắt buộc, trừ khi cần add summary fields/materialized flags

### Files

- `Update` [backend/app/schemas/booking.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/booking.py)
  - add booking detail response
- `Update` [backend/app/repositories/booking_repository.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/repositories/booking_repository.py)
  - get booking detail with items/travelers/documents
- `Update` [backend/app/services/booking_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/booking_service.py)
  - add detail read method
- `Update` [backend/app/api/v1/bookings.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/bookings.py)
  - add `GET /bookings/{booking_id}`

- `Update` [backend/app/schemas/payment.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/payment.py)
  - add payment detail response nếu thiếu
- `Update` [backend/app/services/payment_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/payment_service.py)
  - add get payment detail
- `Update` [backend/app/api/v1/payments.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/payments.py)
  - add `GET /payments/{payment_id}`
  - consider `POST /payments/{payment_id}/confirm` only in non-prod flow

- `Add` `backend/app/api/v1/vouchers.py`
- `Update` [backend/app/schemas/voucher.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/voucher.py)
  - add vouchers list/read model
- `Update` [backend/app/services/voucher_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/voucher_service.py)
  - add list vouchers for user
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)

### Reuse

- [backend/app/api/v1/booking_vouchers.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/booking_vouchers.py)
- [backend/app/services/voucher_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/voucher_service.py)
- [backend/app/services/payment_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/payment_service.py)

### Tests

- `Add` `backend/tests/test_booking_detail_api.py`
- `Add` `backend/tests/test_payment_detail_api.py`
- `Add` `backend/tests/test_vouchers_api.py`
- cover:
  - booking detail owner access
  - payment detail/status consistency
  - voucher list filtered by current user
  - voucher pdf download still works via old and new route

### Done when

- frontend account/checkout pages có thể load detail trực tiếp, không cần list-then-filter

## 10. Workstream F - Support Tickets

### Current state

- chưa có support ticket domain
- mới chỉ có role/support naming ở RBAC tests

### Migration DB

- `Add` Alembic migration: `add_support_tickets_and_messages.py`
- bảng đề xuất:
  - `support_tickets`
  - `support_ticket_messages`

### Files

- `Add` `backend/app/models/support.py`
- `Update` [backend/app/models/__init__.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/__init__.py)
- `Add` `backend/app/repositories/support_repository.py`
- `Add` `backend/app/schemas/support.py`
- `Add` `backend/app/services/support_service.py`
- `Add` `backend/app/api/v1/support.py`
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)

### Reuse

- [backend/app/services/audit_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/audit_service.py)
- outbox/email/notification worker cho support reply alerts

### Tests

- `Add` `backend/tests/test_support_tickets.py`
- cover:
  - create/list/detail ticket
  - reply to ticket
  - close ticket
  - access isolation
  - invalid transition guard

### Done when

- frontend support page có thể chạy end-to-end với dữ liệu thật

## 11. Workstream G - Persistent Notifications Inbox

### Current state

- có notification worker/outbox
- chưa có persistent notification inbox cho user

### Migration DB

- `Add` Alembic migration: `add_notifications_table.py`
- bảng đề xuất:
  - `notifications`
  - `id`
  - `user_id`
  - `type`
  - `title`
  - `message`
  - `payload`
  - `read_at`
  - `created_at`

### Files

- `Add` `backend/app/models/notification.py`
- `Update` [backend/app/models/__init__.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/__init__.py)
- `Add` `backend/app/repositories/notification_repository.py`
- `Add` `backend/app/schemas/notification.py`
- `Add` `backend/app/services/notification_service.py`
- `Add` `backend/app/api/v1/notifications.py`
- `Update` [backend/app/services/outbox_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/outbox_service.py)
  - add handler to persist notification records
- `Update` [backend/app/workers/notification_worker.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/workers/notification_worker.py)
  - keep dispatcher responsibilities minimal
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)

### Reuse

- [backend/app/workers/notification_worker.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/workers/notification_worker.py)
- [backend/app/services/outbox_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/outbox_service.py)

### Tests

- `Add` `backend/tests/test_notifications_api.py`
- cover:
  - list notifications
  - mark single as read
  - mark all as read
  - new notification generated from booking/payment/refund flow

### Done when

- frontend notifications page có in-app inbox thật, không chỉ event backend log

## 12. Workstream H - Promotions Domain

### Current state

- coupon domain đã có
- promotions domain chưa có

### Migration DB

- `Add` Alembic migration: `add_promotions_table.py`

### Files

- `Add` `backend/app/models/promotion.py`
- `Update` [backend/app/models/__init__.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/__init__.py)
- `Add` `backend/app/repositories/promotion_repository.py`
- `Add` `backend/app/schemas/promotion.py`
- `Add` `backend/app/services/promotion_service.py`
- `Add` `backend/app/api/v1/promotions.py`
- Optional admin:
  - `Add` `backend/app/api/v1/admin_promotions.py`
  - `Add` `backend/app/services/admin_promotion_service.py`
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)

### Reuse

- coupon applicability ideas từ [backend/app/models/coupon.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/models/coupon.py)
- admin patterns từ [backend/app/api/v1/admin_coupons.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/admin_coupons.py)

### Tests

- `Add` `backend/tests/test_promotions_api.py`
- if admin added:
  - `Add` `backend/tests/test_admin_promotions.py`

### Done when

- frontend public promotion pages/banners có data source riêng, không phải lạm dụng coupons

## 13. Workstream I - Admin Documents And Operations

### Current state

- admin dashboard/payments/exports đã có
- admin documents và admin operations chưa có surface tương ứng frontend

### Migration DB

- No mandatory migration for operations read model
- documents review fields phụ thuộc Workstream C

### Files

- `Add` `backend/app/services/admin_operations_service.py`
- `Add` `backend/app/schemas/admin_operations.py`
- `Add` `backend/app/api/v1/admin_operations.py`
- `Update` [backend/app/api/v1/router.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/router.py)
- `Update` [backend/app/api/dependencies/service_registry.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/service_registry.py)
- `Update` [backend/app/api/dependencies/services.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/dependencies/services.py)
- `Update` [backend/app/core/constants.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/core/constants.py)
  - permissions for document review and operations read

### Reuse

- [backend/app/services/admin_dashboard_service.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/services/admin_dashboard_service.py)
- [backend/app/repositories/outbox_repository.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/repositories/outbox_repository.py)
- startup/runtime health info từ [backend/app/core/startup.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/core/startup.py)

### Tests

- `Add` `backend/tests/test_admin_operations.py`
- `Add` `backend/tests/test_admin_documents.py` if not already added in Workstream C
- cover:
  - permission checks
  - outbox backlog summary
  - runtime task summary
  - degraded dependency visibility

### Done when

- frontend admin operations page không còn phải ráp dữ liệu từ health/readiness lẻ tẻ

## 14. Workstream J - Contract Normalization And Compatibility Layer

### Current state

- error envelope tương đối ổn
- pagination khá nhất quán nhưng còn alias semantics ở client
- nhiều route cũ và route mới có thể cần đồng thời tồn tại trong giai đoạn chuyển tiếp

### Files

- `Update` [backend/app/schemas/common.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/common.py)
  - verify common paginated envelope
- `Update` [backend/app/schemas/error.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/schemas/error.py)
  - keep error envelope canonical
- `Update` route modules affected by aliasing:
  - [backend/app/api/v1/uploads.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/uploads.py)
  - [backend/app/api/v1/booking_cancellations.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/booking_cancellations.py)
  - [backend/app/api/v1/booking_vouchers.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/api/v1/booking_vouchers.py)
- `Update` [backend/docs/api-spec.md](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/docs/api-spec.md)
- `Update` [backend/docs/api-examples.md](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/docs/api-examples.md)

### Compatibility aliases to keep temporarily

- `uploads` -> `documents`
- `bookings/{id}/cancel` alongside canonical `refunds`
- `bookings/{id}/voucher*` alongside canonical `vouchers`

### Tests

- `Add` `backend/tests/test_api_contract_compatibility.py`
- cover:
  - old route and new route return equivalent canonical payload
  - pagination envelope same shape across domains
  - error envelope same shape across domains

### Done when

- frontend client không phải gắn domain-specific adapter chỉ vì naming lệch

## 15. Workstream K - OpenAPI, Seeds, Permissions, Contract Tests

### Files

- `Update` [backend/docs/api-spec.md](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/docs/api-spec.md)
- `Update` [backend/docs/api-examples.md](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/docs/api-examples.md)
- `Update` [backend/scripts/seed_data.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/scripts/seed_data.py)
- `Update` [backend/scripts/seed_demo_environment.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/scripts/seed_demo_environment.py)
- `Update` [backend/scripts/create_admin.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/scripts/create_admin.py)
- `Update` permission constants and seed flow:
  - [backend/app/core/constants.py](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/app/core/constants.py)
  - role/permission related code

### Needed seeds

- support agent
- document reviewer
- promotion manager if admin promotions added
- sample notifications
- sample support tickets
- sample refunds
- sample traveler profiles

### Tests

- `Add` `backend/tests/test_contract_frontend_ver_1_5.py`
- `Add` `backend/tests/test_seed_data_ver_1_5.py`

### Done when

- frontend team có thể tích hợp với seeded data ổn định
- docs và payload thật không lệch nhau

## 16. Migration Batch Đề Xuất

Để tránh migration quá lớn, nên tách thành các batch:

1. `add_saved_travelers_table.py`
2. `add_document_review_fields.py`
3. `add_notifications_table.py`
4. `add_support_tickets_and_messages.py`
5. `add_promotions_table.py`
6. optional hardening migrations cho password reset / permissions / indexes

## 17. Định Nghĩa Hoàn Thành Chung

Một workstream chỉ được coi là xong khi đủ cả 5 điều kiện:

- migration đã có
- route/service/repository/schema đã có
- permission/audit đã xử lý
- tests đã có và pass
- docs/spec/examples đã cập nhật

## 18. Chuỗi Triển Khai Khuyến Nghị

1. Workstream A
2. Workstream E
3. Workstream B
4. Workstream D
5. Workstream F
6. Workstream G
7. Workstream H
8. Workstream I
9. Workstream J
10. Workstream K

## 19. Ghi Chú Cuối

Nếu muốn đi nhanh nhưng vẫn an toàn:

- ưu tiên route canonical mới trước
- giữ alias cũ ít nhất 1 giai đoạn release
- không refactor sâu các service đang ổn chỉ để đẹp
- mọi domain mới phải có test ownership rõ ngay từ đầu

Backlog này nên được dùng như tài liệu theo dõi chính khi bắt đầu nâng backend để match `frontend ver 1.5`.
