# Milestone Checklist

## 1. Mục tiêu tài liệu

Checklist này dùng để quyết định:

- backend hiện tại đã đủ để bắt đầu frontend chưa
- những gì bắt buộc phải chốt trước khi gọi là staging milestone
- những gì có thể để sau staging

## 2. Đánh giá hiện tại

### Kết luận

- Có thể bắt đầu frontend ngay ở mức alpha/integration.
- Chưa nên coi project đã hoàn tất staging milestone production-like.

### Lý do chính

- business logic backend đã đủ dày: auth, booking, coupon, payment, upload, admin
- test suite mạnh và đang pass
- migration validation trong test/CI đã chạy qua Alembic thật
- readiness phản ánh thêm outbox policy, runtime task state và tín hiệu degraded của rate-limit backend
- docs API, curl examples và runbook đã tốt hơn trước
- vẫn còn gap ở secret management, production storage, telemetry pipeline và deployment governance

## 3. Quyết định thực dụng

### Nên làm ngay

- bắt đầu frontend cho các luồng người dùng chính
- chốt một sprint backend ngắn để khóa contract và readiness

### Chưa nên làm ngay

- public staging cho team test rộng
- đóng băng API contract dài hạn
- coi đây là production-ready backend hoàn chỉnh

## 4. Checklist Trước Frontend Alpha

Mục tiêu: đủ ổn để frontend bắt đầu tích hợp, không bị nghẽn bởi backend.

### Bắt buộc

- [x] Chốt danh sách endpoint frontend phase 1 trong docs API
- [x] Chốt shape response rõ ràng cho auth, booking, payment, upload, user profile
- [x] Chuẩn hóa error response dùng chung cho toàn bộ API
- [x] Có seed script cho local/test để frontend và QA có thể dựng dữ liệu cơ bản
- [x] Xác nhận các route chính hoạt động ổn định qua test suite và local smoke

### Nên có

- [x] Viết `docs/api-spec.md`
- [x] Có curl examples cho các flow chính
- [x] Có sample payload thành công/thất bại cho login, booking, payment callback, upload
- [x] Có dữ liệu seed cố định để frontend không phụ thuộc dữ liệu ngẫu nhiên

### Exit Criteria

- frontend có thể gọi và mock ít nhất 5 luồng chính mà không phải hỏi lại backend contract mỗi ngày
- không còn mismatch rõ ràng giữa schema tài liệu và payload thật

## 5. Checklist Trước Staging Milestone

Mục tiêu: backend đủ tin cậy để deploy staging và cho QA/test tích hợp.

### Bắt buộc

- [x] CI verify migration bằng Alembic thật
- [x] Runtime tasks/outbox có trạng thái runtime và metric thay vì chỉ fail âm thầm
- [x] `/health/ready` phản ánh dependency quan trọng cho runtime hiện tại, gồm policy cho outbox
- [x] Xác nhận full stack staging compose chạy sạch từ đầu đến cuối
- [x] Xác nhận migration mới cho `outbox_events` và leases đã chạy được trên DB trống
- [ ] Chốt env staging thật: secret, callback secret, trusted hosts, CORS, Redis, Postgres
- [x] Smoke test có kiểm tra migration/runtime path tối thiểu
- [x] Xác nhận log không có lỗi startup/runtime lặp lại trong luồng bình thường

### Quan trọng cao

- [x] Chuẩn hóa readiness policy cho outbox
- [x] Request path giữ side effects ở chế độ enqueue-only
- [x] Có test cho migration path cũ -> mới
- [x] Có rollback/runbook mức tài liệu nếu migration staging lỗi

### Quan trọng vừa

- [x] Rà lại lint scope để repo sạch ở các file active
- [x] Hoàn thiện tài liệu deploy/runbook để người khác có thể bring-up local stack độc lập
- [ ] Chốt seed admin/permission nhất quán giữa môi trường
- [x] Bổ sung tài liệu CONTRIBUTING / project hygiene cơ bản

### Exit Criteria

- deploy staging từ repo sạch có thể lên được bằng một flow chuẩn
- healthcheck pass thật
- không có runtime error lặp lại trong log ngay sau startup
- team frontend/QA có thể dùng staging mà không cần chỉnh tay DB

## 6. Checklist Sau Staging

Mục tiêu: hardening thêm, không chặn frontend alpha hoặc staging đầu tiên.

### Có thể để sau

- [ ] antivirus/content scanning operations cho upload
- [ ] object storage/presigned URL mặc định cho non-local environments
- [ ] callback trust model mạnh hơn: timestamp window, nonce, gateway-specific canonicalization
- [ ] metrics/alerting thực tế cho rate-limit degradation và outbox failures
- [ ] admin permission governance/seed automation
- [ ] audit/reporting sâu hơn cho abuse detection
- [ ] load test cơ bản cho booking/payment/upload
- [ ] secret manager integration cho staging/production

## 7. Khuyến nghị Thứ Tự Triển Khai

### Phase 1 - Làm ngay trong 1-2 ngày

- [x] viết API contract tối thiểu cho frontend phase 1
- [x] chốt seed data cố định
- [ ] frontend bắt đầu với auth + catalog + booking read/write cơ bản

### Phase 2 - Làm ngay sau đó

- [x] sửa Compose trusted proxy interpolation
- [x] thêm curl examples, contributing docs và migration runbook
- [x] xác nhận staging compose sạch log

### Phase 3

- [ ] cho frontend tích hợp payment status, upload, voucher, admin nếu cần
- [x] chạy smoke trên staging
- [ ] bàn giao cho QA hoặc self-test theo checklist

## 8. Quyết định Cuối Cùng

### Có nên lên frontend bây giờ không?

Có.

### Có nên dừng frontend để tối ưu backend thêm một thời gian dài không?

Không.

### Cách đúng

- làm frontend ngay
- nhưng phải khóa các việc backend sau trước khi gọi là staging milestone:
- migration verification
- runtime/outbox readiness
- API contract
- staging smoke sạch log
- secret/deploy governance

## 9. Top 5 Việc Ưu Tiên Cao Nhất

1. Chốt env staging thật và đưa secrets ra secret manager.
2. Chuyển non-local upload sang object storage/presigned URL.
3. Chuẩn hóa seed admin/permission giữa các môi trường.
4. Đưa metrics và alerts ra hệ quan sát thực tế ngoài local compose.
5. Bổ sung load test cơ bản cho booking/payment/upload.
