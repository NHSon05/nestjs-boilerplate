# Specification: Feature Guide Requests (Feature Spec)

Document này mô tả chi tiết yêu cầu kỹ thuật, quy tắc chuyển đổi trạng thái (State Machine), thông báo (Notifications) và định nghĩa API cho tính năng **Quản lý Yêu cầu Hướng dẫn (Guide Requests)** giữa Tourist và Guide.

---

## 1. Tổng quan nghiệp vụ (Business Overview)

Feature **Guide Requests** cho phép:
1. **Khởi tạo yêu cầu**: Tourist chọn Hướng dẫn viên và tạo `GuideRequest` ở trạng thái `PENDING`.
2. **Thông báo thời gian thực**: Hệ thống tự động tạo thông báo (`Notification`) gửi tới Guide.
3. **Phản hồi yêu cầu**:
   - Guide chấp nhận (`ACCEPT`) -> Trạng thái đổi thành `ACCEPTED`, tự động khởi tạo cuộc trò chuyện (`Conversation`) và thêm 2 thành viên (`ConversationMember`). Trả về `conversationId` cho 2 bên nhắn tin.
   - Guide từ chối (`REJECT`) -> Trạng thái đổi thành `REJECTED`, không tạo `Conversation`.
4. **Hủy yêu cầu**: Tourist hoặc Guide có thể hủy yêu cầu (`CANCEL`) theo điều kiện hợp lệ.
5. **Hoàn thành tour**: Đánh dấu chuyến đi hoàn thành (`COMPLETED`) để mở quyền cho Tourist viết đánh giá (Review).

---

## 2. Quy tắc Máy trạng thái (State Machine Transition Rules)

### Các chuyển đổi trạng thái HỢP LỆ:
- `PENDING` ➔ `ACCEPTED` (Khi Guide chấp nhận)
- `PENDING` ➔ `REJECTED` (Khi Guide từ chối)
- `PENDING` ➔ `CANCELLED` (Khi Tourist hoặc Guide hủy)
- `ACCEPTED` ➔ `CANCELLED` (Khi hủy chuyến đi đã nhận)
- `ACCEPTED` ➔ `COMPLETED` (Khi hoàn thành tour)

### Các chuyển đổi KHÔNG HỢP LỆ (Service bắt buộc ném `ConflictException`):
- ❌ `REJECTED` ➔ `ACCEPTED`
- ❌ `CANCELLED` ➔ `ACCEPTED`
- ❌ `COMPLETED` ➔ `PENDING`

---

## 3. Danh sách API Specification

Tiền tố chung: `/api/v1`

### 3.1. Tạo Yêu cầu Hướng dẫn mới (`POST /guide-requests`)
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "guideId": "guide-user-id-1",
  "title": "Chuyến tham quan Phố cổ Hội An 1 ngày",
  "description": "Cần HDV am hiểu lịch sử và ẩm thực địa phương.",
  "startAt": "2026-08-10T08:00:00.000Z",
  "endAt": "2026-08-10T17:00:00.000Z",
  "meetingAddress": "123 Trần Phú, Minh An, Hội An, Quảng Nam",
  "meetingLatitude": 15.8777,
  "meetingLongitude": 108.3275,
  "proposedPrice": 1500000,
  "currency": "VND"
}
```
- **Response Success (201 Created)**: Trả về chi tiết `GuideRequest` với `status: "PENDING"`.
- **Tác dụng phụ**: Tạo bản ghi `Notification` (`type: GUIDE_REQUEST_RECEIVED`) cho `guideId`.

---

### 3.2. Lấy danh sách Yêu cầu của tôi (`GET /guide-requests/me`)
- **Query Params**: `page`, `limit`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`)
- **Header**: `Authorization: Bearer <token>`
- **Response Success (200 OK)**:
```json
{
  "data": [
    {
      "id": "req-uuid-1",
      "title": "Chuyến tham quan Phố cổ Hội An 1 ngày",
      "status": "PENDING",
      "startAt": "2026-08-10T08:00:00.000Z",
      "endAt": "2026-08-10T17:00:00.000Z",
      "proposedPrice": 1500000,
      "tourist": {
        "id": "tourist-id",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://..."
      },
      "guide": {
        "id": "guide-id",
        "fullName": "Tran Minh Khoa",
        "avatarUrl": "https://..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3.3. Xem Chi tiết Yêu cầu (`GET /guide-requests/:requestId`)

---

### 3.4. Guide Chấp nhận Yêu cầu (`PATCH /guide-requests/:requestId/accept`)
- **Access Control**: Chỉ dành cho `guideId` tương ứng trong request.
- **Xử lý**:
  1. Đổi `status` thành `ACCEPTED`, tự động cập nhật thời gian chấp nhận `acceptedAt = now()`.
  2. Tự động khởi tạo bản ghi `Conversation` (`type = GUIDE_REQUEST`).
  3. Tạo 2 bản ghi `ConversationMember` cho Tourist và Guide.
  4. Tạo `Notification` thông báo cho Tourist (`type: GUIDE_REQUEST_ACCEPTED`).
- **Response (200 OK)**:
```json
{
  "message": "Đã chấp nhận yêu cầu",
  "data": {
    "requestId": "req-uuid-1",
    "status": "ACCEPTED",
    "acceptedAt": "2026-08-02T21:08:28.000Z",
    "conversationId": "conv-uuid-1"
  }
}
```

---

### 3.5. Guide Từ chối Yêu cầu (`PATCH /guide-requests/:requestId/reject`)
- **Access Control**: Chỉ dành cho `guideId`.
- **Request Body**:
```json
{
  "reason": "Tôi bận lịch dẫn đoàn khác vào thời gian này."
}
```
- **Xử lý**:
  1. Đổi `status` thành `REJECTED`, tự động cập nhật thời gian từ chối `rejectedAt = now()`, lưu `rejectionReason`.
  2. Tạo `Notification` thông báo cho Tourist (`type: GUIDE_REQUEST_REJECTED`).
- **Response (200 OK)**:
```json
{
  "message": "Đã từ chối yêu cầu",
  "data": {
    "requestId": "req-uuid-1",
    "status": "REJECTED",
    "rejectedAt": "2026-08-02T21:08:28.000Z",
    "rejectionReason": "Tôi bận lịch dẫn đoàn khác vào thời gian này."
  }
}
```

---

### 3.6. Hủy Yêu cầu (`PATCH /guide-requests/:requestId/cancel`)
- **Access Control**: Tourist hoặc Guide thuộc request.
- **Request Body**:
```json
{
  "reason": "Thay đổi kế hoạch di chuyển."
}
```
- **Xử lý**:
  1. Đổi `status` thành `CANCELLED`, tự động cập nhật thời gian hủy `cancelledAt = now()`, lưu `cancellationReason`.
  2. Nếu có `Conversation` liên quan, cập nhật `Conversation.status` thành `CLOSED`.
  3. Tạo `Notification` thông báo cho người còn lại (`type: GUIDE_REQUEST_CANCELLED`).
- **Response (200 OK)**:
```json
{
  "message": "Đã hủy yêu cầu",
  "data": {
    "requestId": "req-uuid-1",
    "status": "CANCELLED",
    "cancelledAt": "2026-08-02T21:08:28.000Z",
    "cancellationReason": "Thay đổi kế hoạch di chuyển.",
    "conversationStatus": "CLOSED"
  }
}
```
