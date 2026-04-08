# Backend Upgrade Plan To Reach 9-9.5/10 Compatibility With Frontend Ver 1.5

## 1. Mục tiêu

Tài liệu này chốt các nâng cấp backend cần có để frontend theo kiến trúc `ver 1.5`
đạt mức tương thích khoảng `9.0 -> 9.5/10`.

Backlog thực thi chi tiết nằm ở:

- [frontend-ver-1-5-backend-implementation-backlog.md](/Users/quan.nguyen/individual/newwwwwwwww/secure-travel-booking-platform/backend/docs/frontend-ver-1-5-backend-implementation-backlog.md)

Mục tiêu ở đây không phải chỉ "thêm vài route còn thiếu", mà là:

- backend public contract khớp với domain frontend
- tên resource, response shape, pagination, error envelope ổn định
- frontend không cần viết quá nhiều adapter hoặc workaround
- các flow bất đồng bộ như notification, password reset, document verification vẫn vận hành an toàn

## 2. Giả định đầu vào

Giả định frontend `ver 1.5` được giữ làm chuẩn, gồm các domain chính:

- `auth`
- `profile`
- `tours`
- `bookings`
- `travelers`
- `payments`
- `documents`
- `refunds`
- `support`
- `notifications`
- `vouchers`
- `promotions`
- `admin`

Giả định backend hiện tại tiếp tục được tận dụng làm nền, đặc biệt ở các phần đã có sẵn:

- `auth`, `users`
- `flights`, `hotels`, `tours`
- `bookings`, `booking_travelers`, `booking_vouchers`, `booking_cancellations`
- `coupons`, `payments`, `uploads`
- `admin_users`, `admin_bookings`, `admin_payments`, `admin_coupons`, `admin_tours`, `admin_refunds`, `admin_exports`, `admin_dashboard`
- audit/outbox/notification worker

## 3. Kết luận Chốt

Nếu backend được thiết kế lại để match đúng `ver 1.5`, mức tương thích thực tế có thể đạt:

- `9.0/10` khi toàn bộ domain chính đã có contract đúng và test tích hợp chạy ổn
- `9.5/10` khi thêm đủ hardening, contract test, docs, event flow, và migration compatibility

Không nên nhắm `10/10`, vì luôn sẽ còn:

- chi phí đồng bộ release giữa frontend và backend
- thay đổi business rule theo thời gian
- khác biệt nhỏ ở UX state và API semantics

## 4. Chiến lược Thiết Kế Nên Chọn

Nên chọn chiến lược sau:

1. Dùng `frontend ver 1.5` làm public API target.
2. Tận dụng service/repository hiện có ở backend để tránh viết lại business logic.
3. Bổ sung route mới theo domain frontend, đồng thời giữ route cũ như alias tạm thời trong một giai đoạn migration.
4. Chuẩn hóa response/pagination/error thay vì để mỗi module trả shape khác nhau.

Không nên chọn chiến lược:

- giữ nguyên backend hiện tại rồi bắt frontend adapter mọi thứ
- trộn `documents/uploads`, `refunds/cancellations`, `promotions/coupons` mà không định nghĩa resource canonical

## 5. Các Nâng Cấp Bắt Buộc

### 5.1 Auth Và Account Recovery

#### Cần thêm

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `PATCH /users/me` hoặc `PATCH /profile/me`
- `POST /users/me/change-password`

#### Lý do

Frontend `ver 1.5` giả định có:

- quên mật khẩu
- đặt lại mật khẩu
- cập nhật hồ sơ cá nhân
- đổi mật khẩu từ trang account

Backend hiện có login/register/refresh/logout/logout-all, nhưng chưa đủ account lifecycle để khớp trọn vẹn frontend account flows.

#### Thiết kế nên có

- bảng hoặc cơ chế token reset một lần, có expiry
- rate limit cho forgot/reset password
- revoke token hoặc session rotation sau reset password
- audit log cho `password_reset_requested`, `password_reset_completed`, `password_changed`
- email worker hoặc outbox event để gửi reset email

#### Exit criteria

- user có thể tự phục hồi tài khoản mà không cần thao tác tay trong DB
- frontend không phải fake flow forgot/reset

### 5.2 Profile Domain Thật

#### Cần thêm

- `GET /users/me`
- `PATCH /users/me`
- `POST /users/me/change-password`

#### Lý do

Frontend `profile` không nên chỉ là một màn hình đọc `me`. Muốn đạt mức tương thích cao, backend phải coi profile là domain account hoàn chỉnh.

#### Thiết kế nên có

- update validation cho `full_name`, `date_of_birth`, `nationality`, `passport_number`
- optimistic-safe update semantics
- error code rõ cho validation/conflict

### 5.3 Travelers Domain Ở Cấp User

#### Cần thêm

- `GET /travelers`
- `POST /travelers`
- `GET /travelers/{traveler_id}`
- `PATCH /travelers/{traveler_id}`
- `DELETE /travelers/{traveler_id}`

#### Lý do

Backend hiện có traveler theo booking qua `booking_travelers`, nhưng frontend `ver 1.5` giả định user có thể quản lý traveler profiles trong trang account và tái sử dụng ở checkout.

#### Thiết kế nên có

- traveler profile thuộc về user, không phụ thuộc booking
- booking traveler có thể snapshot từ traveler profile
- tách rõ:
  - saved travelers
  - travelers attached to a booking

#### Khuyến nghị triển khai

- giữ `booking_travelers` cho flow tour traveler hiện tại
- thêm `saved_travelers` resource mới cho account-level traveler management

### 5.4 Documents Domain Canonical

#### Cần thêm

- `GET /documents`
- `POST /documents`
- `GET /documents/{document_id}`
- `DELETE /documents/{document_id}`
- `GET /documents/{document_id}/download`

#### Nâng cấp admin

- `GET /admin/documents`
- `GET /admin/documents/{document_id}`
- `POST /admin/documents/{document_id}/approve`
- `POST /admin/documents/{document_id}/reject`

#### Lý do

Backend hiện dùng `uploads` làm resource kỹ thuật. Frontend `ver 1.5` lại dùng `documents` như domain nghiệp vụ. Muốn tương thích cao thì public API nên canonical theo `documents`, còn `uploads` chỉ là implementation detail hoặc alias.

#### Thiết kế nên có

- status rõ: `pending`, `approved`, `rejected`, `expired`
- metadata đầy đủ: owner, booking_id, traveler_id, mime_type, size, uploaded_at, reviewed_at, reviewed_by
- delete policy rõ:
  - chỉ delete khi chưa approved
  - hoặc soft-delete có audit
- malware scan/verifier state nếu muốn production-like

### 5.5 Refunds Domain Rõ Ràng

#### Cần thêm

- `GET /refunds`
- `GET /refunds/{refund_id}`
- `POST /refunds`

#### Có thể giữ alias

- `POST /bookings/{booking_id}/cancel`

#### Lý do

Hiện user-side refund đang implicit qua booking cancellation. Frontend `ver 1.5` lại có page `RefundsPage`, `RefundDetailPage`, `RefundRequestForm`. Muốn đạt 9+ thì refund phải là resource rõ ràng, không chỉ là side effect ẩn của cancel booking.

#### Thiết kế nên có

- request refund có thể gắn `booking_id`, `reason`
- response có timeline hoặc state tối thiểu:
  - `requested`
  - `pending_review`
  - `approved`
  - `rejected`
  - `processed`
- mapping rõ giữa:
  - booking cancellation
  - refund record
  - payment reversal/refund settlement

### 5.6 Support Tickets

#### Cần thêm

- `GET /support/tickets`
- `POST /support/tickets`
- `GET /support/tickets/{ticket_id}`
- `POST /support/tickets/{ticket_id}/messages`
- `POST /support/tickets/{ticket_id}/close`

#### Lý do

Frontend `support` domain không thể chạy thật nếu backend không có ticketing resource. Đây là một trong các gap lớn nhất giữa `ver 1.5` và backend hiện tại.

#### Thiết kế nên có

- bảng `support_tickets`
- bảng `support_ticket_messages`
- trạng thái tối thiểu:
  - `open`
  - `in_progress`
  - `waiting_for_customer`
  - `resolved`
  - `closed`
- optional attachment support sau
- audit log cho mọi state transition

### 5.7 User Notifications

#### Cần thêm

- `GET /notifications`
- `GET /notifications/{notification_id}`
- `POST /notifications/{notification_id}/read`
- `POST /notifications/read-all`

#### Lý do

Backend hiện có notification worker/outbox, nhưng chưa có persistent user notification inbox. Frontend `ver 1.5` lại có `NotificationsPage` và use cases mark-as-read.

#### Thiết kế nên có

- bảng `notifications`
- read-state theo user
- event source từ:
  - booking created
  - payment success/failed
  - refund updated
  - document approved/rejected
  - support reply
- outbox dispatch để gửi push/email/in-app tách rời khỏi request path

### 5.8 Promotions Domain Tách Khỏi Coupons

#### Cần thêm

- `GET /promotions`
- `GET /promotions/{promotion_id}`

#### Nếu cần admin sau này

- `GET /admin/promotions`
- `POST /admin/promotions`
- `PATCH /admin/promotions/{promotion_id}`
- `POST /admin/promotions/{promotion_id}/deactivate`

#### Lý do

`promotion` và `coupon` không nên bị đồng nhất:

- coupon là incentive áp dụng vào checkout
- promotion là campaign/content/business offer dùng cho public page, banner, featured collections

#### Thiết kế nên có

- promotion read model có:
  - title
  - subtitle
  - image
  - landing_url
  - start_at
  - end_at
  - active
  - optional linked coupon code

### 5.9 Booking Contract Hoàn Chỉnh

#### Cần thêm

- `GET /bookings/{booking_id}`
- nếu frontend vẫn cần checkout preview thì thêm endpoint read model tương ứng

#### Lý do

Frontend `ver 1.5` có `BookingDetailPage`, nhưng backend hiện chủ yếu có create/list/cancel. Thiếu detail endpoint sẽ làm frontend phải fetch list rồi tự lọc, không bền.

#### Thiết kế nên có

- booking detail trả đủ:
  - booking core
  - items
  - payment summary
  - travelers
  - voucher status
  - refund/cancellation summary nếu có

### 5.10 Payment Contract Đồng Nhất

#### Cần thêm hoặc chuẩn hóa

- `GET /payments/{payment_id}`
- `GET /payments/booking/{booking_id}`
- `POST /payments/{payment_id}/confirm` nếu frontend giữ confirm flow

#### Lý do

Backend hiện có `initiate`, callback, simulate-success, status-by-booking. Muốn match frontend `ver 1.5` tốt hơn thì payment contract cần dễ đọc hơn cho client.

#### Thiết kế nên có

- tách rõ:
  - initiate payment
  - fetch payment detail
  - fetch payment status by booking
  - sandbox/manual confirm only for non-prod
- idempotency key bắt buộc cho create/initiate
- payment status và booking payment status phải thống nhất enum

### 5.11 Vouchers Domain Dễ Dùng Hơn

#### Cần thêm

- `GET /vouchers`
- `GET /vouchers/{booking_id}`
- `GET /vouchers/{booking_id}/download`

#### Có thể giữ alias

- `GET /bookings/{booking_id}/voucher`
- `GET /bookings/{booking_id}/voucher.pdf`

#### Lý do

Backend hiện voucher gắn vào booking. Frontend `ver 1.5` lại có `VouchersPage` như một domain riêng trong account. Nên có read model voucher để frontend không phải tự quét hết bookings rồi suy ra voucher.

### 5.12 Admin Documents Và Operations

#### Cần thêm

- admin documents review endpoints như ở mục 5.4
- `GET /admin/operations/overview`
- `GET /admin/operations/outbox`
- `GET /admin/operations/runtime-tasks`
- `GET /admin/operations/security-events`

#### Lý do

Frontend `ver 1.5` có `admin/documents` và `admin/operations`. Backend hiện có dashboard/payments/exports, nhưng chưa có operations board và admin document review contract tương ứng.

#### Thiết kế nên có

- operations không chỉ là healthcheck thô
- nên có read model tổng hợp cho:
  - outbox backlog
  - worker health
  - recent failures
  - degraded dependencies
  - security alerts quan trọng

## 6. Các Nâng Cấp Chuẩn Hóa Contract

Các phần dưới đây không phải domain mới, nhưng bắt buộc để đạt `9+`.

### 6.1 Pagination Envelope Dùng Chung

Tất cả list endpoints nên thống nhất:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100
}
```

Nếu cần compatibility tạm thời, có thể giữ alias field, nhưng OpenAPI nên chốt một chuẩn duy nhất.

### 6.2 Error Envelope Dùng Chung

Giữ một chuẩn duy nhất cho:

- validation
- auth
- authorization
- not found
- conflict
- rate limit
- internal server error

Frontend càng ít phải parse special-case thì compatibility càng cao.

### 6.3 Enum Và Timestamp Nhất Quán

Nên chốt:

- enum trả về một kiểu casing duy nhất
- timestamp luôn ISO-8601 UTC
- decimal/money field luôn cùng convention

### 6.4 Filter Và Query Param Nhất Quán

Nên chốt chung:

- `page`
- `page_size`
- `sort_by`
- `sort_order`
- domain-specific filters dùng cùng naming style

### 6.5 Mutation Response Nhất Quán

Sau mutation nên trả về:

- resource mới nhất
- hoặc operation result có đủ field để frontend invalidate/refetch đúng

Tránh trả shape quá nghèo khiến frontend phải gọi thêm 2-3 request chỉ để sync UI.

## 7. Nâng Cấp Về Dữ Liệu Và Hạ Tầng

### 7.1 Bảng Mới Khuyến Nghị

- `password_reset_tokens` hoặc cơ chế tương đương
- `saved_travelers`
- `notifications`
- `support_tickets`
- `support_ticket_messages`
- `promotions`
- nếu cần: `document_reviews`

### 7.2 Tận Dụng Hạ Tầng Hiện Có

Các phần nên tái sử dụng thay vì làm mới:

- outbox service
- notification worker
- audit service
- payment/refund models
- upload service
- traveler schema/service hiện tại cho booking-scoped travelers

### 7.3 Event Flow Nên Có

Các event nên được phát qua outbox:

- password reset requested
- booking created
- payment succeeded
- refund status changed
- document reviewed
- support ticket replied
- notification created

## 8. Ưu Tiên Thực Thi

### Phase A - Bắt buộc để đạt khoảng 9.0/10

- forgot/reset password
- profile update/change password
- saved travelers CRUD
- canonical documents resource
- refunds resource user-side
- support tickets
- notifications inbox
- promotions read API
- booking detail endpoint
- payment detail/status contract cleanup
- vouchers list/read model
- admin documents

### Phase B - Bắt buộc để tiến gần 9.5/10

- admin operations read model
- contract test giữa frontend và backend
- OpenAPI/spec/examples đầy đủ cho domain mới
- compatibility aliases cho route cũ trong giai đoạn migration
- migration/backfill strategy cho notification, promotion, traveler profile
- permissions seed cho admin/support/document reviewer

### Phase C - Hardening rất nên có

- email templates và retry policy cho password reset/support notifications
- idempotency ở các mutation nhạy cảm
- rate limit cho support ticket creation và forgot password
- soft-delete/audit cho documents và promotions
- richer observability cho admin operations

## 9. Đề Xuất Route Surface Mục Tiêu

### Auth/Profile

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /users/me`
- `PATCH /users/me`
- `POST /users/me/change-password`

### Catalog

- `GET /flights`
- `GET /flights/{id}`
- `GET /hotels`
- `GET /hotels/{id}`
- `GET /tours`
- `GET /tours/{id}`
- `GET /promotions`
- `GET /promotions/{id}`

### Booking/Checkout

- `POST /bookings`
- `POST /bookings/hotels`
- `POST /bookings/tours`
- `GET /bookings`
- `GET /bookings/{id}`
- `GET /travelers`
- `POST /travelers`
- `PATCH /travelers/{id}`
- `DELETE /travelers/{id}`
- `GET /bookings/{id}/travelers`
- `POST /bookings/{id}/travelers`
- `POST /coupons/apply`
- `POST /payments/initiate`
- `GET /payments/{id}`
- `GET /payments/booking/{booking_id}`

### Documents/Refunds/Vouchers/Support/Notifications

- `GET /documents`
- `POST /documents`
- `GET /documents/{id}`
- `DELETE /documents/{id}`
- `GET /documents/{id}/download`
- `GET /refunds`
- `GET /refunds/{id}`
- `POST /refunds`
- `GET /vouchers`
- `GET /vouchers/{booking_id}`
- `GET /vouchers/{booking_id}/download`
- `GET /support/tickets`
- `POST /support/tickets`
- `GET /support/tickets/{id}`
- `POST /support/tickets/{id}/messages`
- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`

### Admin

- `GET /admin/dashboard/summary`
- `GET /admin/users`
- `GET /admin/bookings`
- `GET /admin/payments`
- `GET /admin/audit-logs`
- `GET /admin/coupons`
- `POST /admin/coupons`
- `PUT /admin/coupons/{id}`
- `POST /admin/coupons/{id}/deactivate`
- `GET /admin/tours`
- `POST /admin/tours`
- `PUT /admin/tours/{id}`
- `GET /admin/tours/{id}/schedules`
- `POST /admin/tours/{id}/schedules`
- `PUT /admin/tour-schedules/{id}`
- `GET /admin/refunds`
- `PUT /admin/refunds/{id}`
- `GET /admin/documents`
- `POST /admin/documents/{id}/approve`
- `POST /admin/documents/{id}/reject`
- `GET /admin/operations/overview`
- `GET /admin/operations/outbox`
- `GET /admin/operations/runtime-tasks`
- `GET /admin/exports/bookings.csv`
- `GET /admin/exports/refunds.csv`
- `GET /admin/exports/audit-logs.csv`

## 10. Tiêu Chí Đạt 9.0/10

- frontend không cần gọi route "sai tên domain" rồi tự adapter
- account, checkout, documents, refunds, vouchers, admin đều có route thật
- ít nhất 90% page trong `ver 1.5` có thể dùng dữ liệu thật, không phải placeholder
- OpenAPI và docs phản ánh đúng payload thật
- integration tests cover các luồng chính

## 11. Tiêu Chí Đạt 9.5/10

- có backward-compatible migration plan cho route cũ
- contract tests chạy giữa frontend client và backend
- mọi domain mới đều có audit + permission + error semantics rõ
- outbox/event flow cho password reset, notifications, support, documents vận hành ổn
- admin operations đủ dữ liệu để support team vận hành thật

## 12. Checklist Theo Dõi

### Contract

- [ ] chốt canonical resource names theo `ver 1.5`
- [ ] chốt pagination envelope duy nhất
- [ ] chốt error envelope duy nhất
- [ ] chốt enum/timestamp convention

### Auth/Profile

- [ ] thêm forgot password
- [ ] thêm reset password
- [ ] thêm update profile
- [ ] thêm change password

### Travelers

- [ ] thêm saved travelers CRUD
- [ ] giữ booking travelers như domain riêng

### Documents

- [ ] thêm canonical documents API
- [ ] thêm admin documents review API

### Refunds

- [ ] thêm user refunds list/detail/create
- [ ] mapping rõ refund với cancellation/payment

### Support/Notifications/Promotions

- [ ] thêm support ticket API
- [ ] thêm persistent notifications API
- [ ] thêm promotions read API

### Booking/Payment/Voucher

- [ ] thêm booking detail API
- [ ] chuẩn hóa payment detail/status API
- [ ] thêm vouchers read model

### Admin/Operations

- [ ] thêm admin operations read model
- [ ] bổ sung permissions/seed cho role mới

### Delivery Quality

- [ ] update OpenAPI + docs/api-spec.md + docs/api-examples.md
- [ ] thêm integration tests cho domain mới
- [ ] thêm migration/backfill plan
- [ ] giữ alias route cũ trong giai đoạn chuyển tiếp

## 13. Chốt Cuối

Để backend match `frontend ver 1.5` ở mức `9.0 -> 9.5/10`, cần xem đây là một đợt nâng cấp `API surface + domain model + event flow`, không chỉ là một đợt thêm endpoint rời rạc.

Thứ tự đúng là:

1. chốt domain canonical
2. chốt contract
3. thêm domain còn thiếu
4. chuẩn hóa response
5. thêm test/docs/migration

Nếu làm đúng theo hướng này, frontend sẽ bớt adapter, bớt special-case, và team sẽ giữ được kiến trúc sạch lâu dài.
