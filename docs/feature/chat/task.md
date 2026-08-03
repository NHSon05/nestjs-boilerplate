# Task Checklist: Feature Chat (Feature Tasks)

Danh sách nhiệm vụ thực thi chi tiết theo thứ tự triển khai từng bước cho tính năng **Chat & Call**.

---

## 1. Thứ tự triển khai cụ thể (Execution Checklist)

- [ ] **Task 1: Cấu hình Database Schema & Migration**
  - [ ] Kiểm tra và bổ sung các Model `Conversation`, `ConversationMember`, `Message`, `MessageAttachment`, `CallRecord`, `Review` trong `prisma/schema.prisma`.
  - [ ] Thêm các Enum: `ConversationType`, `MessageType`, `CallType`, `CallStatus`, `AttachmentType`, `ConversationStatus`.
  - [ ] Chạy `npx prisma migrate dev` và `npx prisma generate`.

- [ ] **Task 2: Tự động khởi tạo Conversation khi Guide Request được ACCEPTED**
  - [ ] Cập nhật method `accept()` trong `GuideRequestsService`.
  - [ ] Tạo bản ghi `Conversation` (`type = GUIDE_REQUEST`).
  - [ ] Thêm 2 bản ghi `ConversationMember` tương ứng cho `touristId` và `guideId`.

- [ ] **Task 3: Module Conversations & API lấy danh sách hội thoại**
  - [ ] Tạo `ConversationsModule`, `ConversationsController`, `ConversationsService`.
  - [ ] Xây dựng DTO `GetConversationsDto` (hỗ trợ `page`, `limit`).
  - [ ] Xây dựng API `GET /api/v1/conversations` (Lấy thông tin `otherUser`, `lastMessage`, tính `unreadCount`).
  - [ ] Xây dựng API `GET /api/v1/conversations/:conversationId`.

- [ ] **Task 4: Module Messages & API tin nhắn REST**
  - [ ] Xây dựng DTO `CreateMessageDto` (gồm `type`, `content`, `clientMessageId`, `attachments`).
  - [ ] Xây dựng API `GET /api/v1/conversations/:conversationId/messages` (phân trang lịch sử tin nhắn).
  - [ ] Xây dựng API `POST /api/v1/conversations/:conversationId/messages` (Xử lý chống gửi trùng qua `clientMessageId`).
  - [ ] Xây dựng API `PATCH /api/v1/conversations/:conversationId/read` (Cập nhật trạng thái đã đọc).
  - [ ] Xây dựng API `PATCH /api/v1/messages/:messageId` (Sửa tin nhắn).
  - [ ] Xây dựng API `DELETE /api/v1/messages/:messageId` (Xóa mềm tin nhắn).

- [ ] **Task 5: WebSocket Realtime Gateway (Socket.IO)**
  - [ ] Tạo `ChatGateway` gắn `@WebSocketGateway()`.
  - [ ] Cấu hình Socket Auth Middleware kiểm tra JWT Bearer Token khi handshake.
  - [ ] Xử lý event `join_conversation` và `leave_conversation` gia nhập/rời room `conversationId`.
  - [ ] Xử lý event `send_message`: Lưu tin nhắn vào DB -> Broadcast `new_message` tới room -> Cập nhật `lastMessageAt`.
  - [ ] Xử lý event `typing_start` và `typing_stop` broadcast trạng thái gõ phím.
  - [ ] Xử lý event `message_read` thông báo đối phương đã đọc.

- [ ] **Task 6: Module Upload Ảnh & File đính kèm**
  - [ ] Tạo endpoint `POST /api/v1/uploads/chat` upload file đa phương tiện lên Cloudinary.
  - [ ] Trả về metadata chi tiết (URL, publicId, dimensions, fileSize, mimeType).
  - [ ] Liên kết `MessageAttachment` khi gửi tin nhắn dạng `IMAGE` / `FILE`.

- [ ] **Task 7: Module AI Conversation Assistant**
  - [ ] Tạo `AiConversationModule`, `AiConversationController`, `AiConversationService`.
  - [ ] Xây dựng API `POST /api/v1/ai/conversations`.
  - [ ] Xây dựng API `GET /api/v1/ai/conversations`.
  - [ ] Xây dựng API `GET /api/v1/ai/conversations/:id/messages`.
  - [ ] Xây dựng API `POST /api/v1/ai/conversations/:id/messages` (Tích hợp SDK Gemini/OpenAI).
  - [ ] Xây dựng API `DELETE /api/v1/ai/conversations/:id`.

- [ ] **Task 8: Integration Audio / Video Call**
  - [ ] Lựa chọn và tích hợp dịch vụ WebRTC Provider (Agora / Twilio / Stream Video).
  - [ ] Xây dựng API `POST /api/v1/conversations/:id/calls` (Tạo phiên gọi, lưu `CallRecord`, trả Access Token).
  - [ ] Xây dựng API `PATCH /api/v1/calls/:id/accept`.
  - [ ] Xây dựng API `PATCH /api/v1/calls/:id/reject`.
  - [ ] Xây dựng API `PATCH /api/v1/calls/:id/end`.

- [ ] **Task 9: Hoàn thành Tour & Đánh giá (Review)**
  - [ ] Xây dựng API `PATCH /api/v1/guide-requests/:id/complete` (Kiểm tra điều kiện hợp lệ và cập nhật `COMPLETED`).
  - [ ] Xây dựng API `POST /api/v1/guide-requests/:id/review` (Kiểm tra `currentUser = touristId`, chưa có review, rating 1-5 sao).
