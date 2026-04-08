# Data Flow Diagram (DFD) - Secure Travel Booking Platform

## 1. Overview

Tài liệu này mô tả luồng dữ liệu chính trong Secure Travel Booking Platform dưới góc nhìn security engineer.

Hệ thống gồm các miền chức năng chính:

- Authentication
- Flight Booking
- Hotel Booking
- Coupon Apply
- Payment Processing
- Document Upload/Download
- Admin Monitoring

---

## 2. External Entities

### E1. End User
Người dùng cuối sử dụng:
- register
- login
- search flights/hotels
- create bookings
- apply coupons
- initiate payment
- upload/download documents

### E2. Admin User
Người quản trị sử dụng:
- list users/bookings/payments/audit logs
- create/update/deactivate coupon

### E3. Payment Gateway (Mock)
Hệ thống thanh toán ngoài gọi callback vào API.

### E4. File Consumer
Chính user đã upload document và tải document thuộc quyền sở hữu của mình.

---

## 3. Data Stores

### D1. Users Store
Chứa:
- users
- roles
- user_roles
- refresh_tokens
- password_reset_tokens
- login_attempts

### D2. Travel Inventory Store
Chứa:
- airlines
- airports
- flights
- hotels
- hotel_rooms

### D3. Booking Store
Chứa:
- bookings
- booking_items
- travelers

### D4. Coupon Store
Chứa:
- coupons
- coupon_usages

### D5. Payment Store
Chứa:
- payments
- payment_transactions
- payment_callbacks

### D6. Document Store
Chứa:
- uploaded_documents
- file storage path / local upload files

### D7. Monitoring Store
Chứa:
- audit_logs
- security_events
- app_settings

---

## 4. Core Processes

## P1. Authentication & Authorization

### Input
- email
- password
- JWT token
- admin-protected route access

### Process
- validate credentials
- hash/verify password
- issue JWT
- resolve current user
- enforce admin role if required

### Output
- access token
- user profile
- login attempts log
- audit/security events

### DFD Flow
```text
End User
  -> Auth API
  -> Auth Service
  -> Users Store
  -> JWT Response

Auth API
  -> Audit Service
  -> Monitoring Store