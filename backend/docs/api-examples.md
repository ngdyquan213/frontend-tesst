# API Examples

Các ví dụ dưới đây dùng `curl` để frontend, QA hoặc reviewer có thể chạy nhanh các flow chính.

Biến mẫu:

```bash
BASE_URL=http://localhost/api/v1
EMAIL=alice@example.com
PASSWORD=Password123
```

## 1. Register

```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "username": "alice",
    "full_name": "Alice Nguyen",
    "password": "'"$PASSWORD"'"
  }'
```

## 2. Login

```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }'
```

Lưu `access_token` và `refresh_token` từ response để dùng tiếp.

## 3. Get Current User

```bash
curl "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 4. List Catalog Data

```bash
curl "$BASE_URL/flights"
curl "$BASE_URL/hotels"
curl "$BASE_URL/tours"
```

## 5. Create Flight Booking

```bash
curl -X POST "$BASE_URL/bookings" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flight_id": "flight-uuid",
    "quantity": 2
  }'
```

Lưu `booking_id` từ response.

## 6. Initiate Payment

```bash
curl -X POST "$BASE_URL/payments/initiate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Idempotency-Key: booking-uuid-v1" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "'"$BOOKING_ID"'",
    "payment_method": "vnpay"
  }'
```

## 7. Query Payment Status

```bash
curl "$BASE_URL/payments/booking/$BOOKING_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 8. Upload Traveler Document

```bash
curl -X POST "$BASE_URL/uploads/documents" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@./sample-passport.pdf" \
  -F "document_type=passport" \
  -F "booking_id=$BOOKING_ID"
```

## 9. Refresh Token

```bash
curl -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'"$REFRESH_TOKEN"'"
  }'
```

## 10. Logout

```bash
curl -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'"$REFRESH_TOKEN"'"
  }'
```

## Notes

- Với local compose qua Nginx, `BASE_URL=http://localhost/api/v1`.
- Với staging compose mặc định, `BASE_URL=http://localhost:8080/api/v1`.
- Callback signing của payment hiện là mock flow, nên nên dùng test suite hoặc helper nội bộ để tạo chữ ký hợp lệ.
