# Test Plan: Feature Guide Requests (Test Plan)

Document này mô tả chiến lược kiểm thử, kịch bản kiểm thử (Test Cases) và tiêu chí nghiệm thu cho tính năng **Quản lý Yêu cầu Hướng dẫn**.

---

## 1. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing**: Kiểm thử độc lập `GuideRequestsService` và phương thức kiểm tra máy trạng thái `validateStateTransition`.
- **Integration Testing**: Kiểm thử luồng tạo Notification tự động và tạo `Conversation` khi chấp nhận request.

---

## 2. Kịch bản kiểm thử chi tiết (Test Cases)

### 2.1. Khởi tạo Yêu cầu (Create Request)
- [ ] **TC-REQ-01**: Tourist gửi yêu cầu mới hợp lệ (`POST /guide-requests`) -> Trả về `201 Created` với `status: PENDING`, bản ghi Notification cho Guide được khởi tạo.
- [ ] **TC-REQ-02**: Tourist gửi yêu cầu với `startAt` trong quá khứ hoặc `endAt <= startAt` -> Trả về lỗi `400 Bad Request`.
- [ ] **TC-REQ-03**: Tourist gửi yêu cầu cho chính mình -> Trả về lỗi `400 Bad Request`.

### 2.2. Chấp nhận & Khởi tạo Chat (Accept Request)
- [ ] **TC-ACC-01**: Guide tương ứng gọi `PATCH /guide-requests/:id/accept` -> Trạng thái đổi thành `ACCEPTED`, tự động lưu `acceptedAt`, khởi tạo 1 bản ghi `Conversation` và 2 bản ghi `ConversationMember`.
- [ ] **TC-ACC-02**: User không phải Guide của request gọi `accept` -> Trả về lỗi `403 Forbidden`.
- [ ] **TC-ACC-03**: Chấp nhận một request đã ở trạng thái `REJECTED` hoặc `CANCELLED` -> Trả về lỗi `409 Conflict`.

### 2.3. Từ chối & Hủy Yêu cầu (Reject & Cancel)
- [ ] **TC-REJ-01**: Guide từ chối yêu cầu `PENDING` -> Trạng thái đổi thành `REJECTED`, tự động lưu `rejectedAt` và `rejectionReason`, không tạo `Conversation`.
- [ ] **TC-CAN-01**: Tourist/Guide hủy yêu cầu `PENDING` hoặc `ACCEPTED` -> Trạng thái đổi thành `CANCELLED`, tự động lưu `cancelledAt` và `cancellationReason`.
