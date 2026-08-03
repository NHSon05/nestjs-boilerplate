# Task Checklist: Feature Guide Requests (Feature Tasks)

Danh sách nhiệm vụ thực thi chi tiết theo thứ tự triển khai từng bước cho tính năng **Quản lý Yêu cầu Hướng dẫn**.

---

## 1. Danh sách công việc (Checklist)

- [ ] **Task 1: DTO Validation Setup**
  - [ ] Check `CreateGuideRequestDto` (`guideId`, `title`, `startAt`, `endAt`, `proposedPrice`, ...).
  - [ ] Check `GetMyGuideRequestsDto` (`status`, `page`, `limit`).
  - [ ] Check `RejectGuideRequestDto` (`reason`).
  - [ ] Check `CancelGuideRequestDto` (`reason`).

- [x] **Task 2: Service & State Machine Validation**
  - [ ] Viết helper function `validateStateTransition(currentStatus, targetStatus)`.
  - [x] Tự động ghi nhận thời gian `acceptedAt`, `rejectedAt`, `cancelledAt` khi chuyển đổi trạng thái request.
  - [x] Viết logic tự động tạo `Conversation` và `ConversationMember` khi trạng thái đổi thành `ACCEPTED`.
  - [x] Tích hợp ghi log `Notification` tự động khi tạo/chấp nhận/từ chối/hủy yêu cầu.

- [x] **Task 3: Controller Endpoints & Auto Timestamping**
  - [x] Implement `POST /api/v1/guide-requests` (Tạo yêu cầu mới).
  - [x] Implement `GET /api/v1/guide-requests/me` (Lấy danh sách tối ưu hóa query).
  - [x] Implement `GET /api/v1/guide-requests/:requestId` (Xem chi tiết yêu cầu).
  - [x] Implement `PATCH /api/v1/guide-requests/:requestId/accept` (Guide chấp nhận - tự động lưu `acceptedAt` & trả về trong response).
  - [x] Implement `PATCH /api/v1/guide-requests/:requestId/reject` (Guide từ chối - tự động lưu `rejectedAt` & trả về trong response).
  - [x] Implement `PATCH /api/v1/guide-requests/:requestId/cancel` (Hủy yêu cầu - tự động lưu `cancelledAt` & trả về trong response).
