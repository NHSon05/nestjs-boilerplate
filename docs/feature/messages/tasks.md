# Feature Task Breakdown: Conversation & Messaging

> **Tài liệu liên quan**:
>
> - Spec: [spec.md](file:///Users/nguyenhongson/Documents/Learning/nestjs-boilerplate/docs/feature/messages/spec.md)
> - Implementation Plan: [plan.md](file:///Users/nguyenhongson/Documents/Learning/nestjs-boilerplate/docs/feature/messages/plan.md)

---

## 📌 Danh sách công việc (Task List)

### 🗄️ Task Group 1: Database & Prisma Schema Verification

- [ ] **Task 1.1**: Kiểm tra và hoàn thiện Prisma Schema
  - **Mục tiêu**: Kiểm tra các model `Conversation`, `ConversationMember`, `Message`, `MessageAttachment` trong `prisma/schema.prisma`.
  - **Chi tiết**:
    - Đảm bảo có constraint `@@unique([senderId, clientMessageId])` cho tính Idempotency.
    - Đảm bảo có index `@@index([conversationId, sentAt])` hỗ trợ phân trang tin nhắn.
  - **File tác động**: `prisma/schema.prisma`

- [ ] **Task 1.2**: Generate Prisma Client & Chạy Migration
  - **Mục tiêu**: Cập nhật client code để nhận diện đúng schema mới nhất.
  - **Lệnh thực hiện**: `npx prisma generate` & `npx prisma migrate dev` (nếu có thay đổi schema).

---

### 💬 Task Group 2: Conversations Module (`src/conversations`)

- [ ] **Task 2.1**: Tạo DTOs cho Conversations
  - **Mục tiêu**: Validation dữ liệu đầu vào cho danh sách cuộc trò chuyện.
  - **File tác động**:
    - `src/conversations/dto/get-conversations.dto.ts` (Phân trang `page`, `limit`, tìm kiếm `keyword`, `status`)
    - `src/conversations/dto/mark-conversation-read.dto.ts`

- [ ] **Task 2.2**: Hoàn thiện `ConversationsService`
  - **Mục tiêu**: Xử lý logic nghiệp vụ cho cuộc trò chuyện.
  - **Chi tiết các method**:
    - `findAll(currentUserId, query)`: Trả về danh sách cuộc trò chuyện, `otherUser`, `lastMessage`, `unreadCount`.
    - `findOne(currentUserId, conversationId)`: Lấy chi tiết cuộc trò chuyện, ném `ForbiddenException` nếu user không thuộc hội thoại.
    - `markAsRead(currentUserId, conversationId)`: Đánh dấu `lastReadAt = now()`.
    - `assertActiveMember(currentUserId, conversationId)`: Helper kiểm tra tư cách thành viên.
    - `createForGuideRequest(guideRequestId, touristId, guideId)`: Tạo Conversation & 2 Member khi GuideRequest được chấp nhận.
  - **File tác động**: `src/conversations/conversations.service.ts`

- [ ] **Task 2.3**: Hoàn thiện `ConversationsController`
  - **Mục tiêu**: Expose REST APIs cho Conversations.
  - **Chi tiết endpoints**:
    - `GET /api/v1/conversations`
    - `GET /api/v1/conversations/:conversationId`
    - `PATCH /api/v1/conversations/:conversationId/read`
  - **File tác động**: `src/conversations/conversations.controller.ts`

- [ ] **Task 2.4**: Cập nhật `ConversationsModule`
  - **File tác động**: `src/conversations/conversations.module.ts`

---

### ✉️ Task Group 3: Messages Module (`src/messages`)

- [ ] **Task 3.1**: Khởi tạo DTOs cho Messages
  - **File tác động**:
    - `src/messages/dto/create-message.dto.ts` (`type`, `content`, `clientMessageId`, `replyToId`, `attachments`)
    - `src/messages/dto/get-messages.dto.ts` (Cursor pagination: `limit`, `cursor`, `before`)
    - `src/messages/dto/update-message.dto.ts` (`content`)
    - `src/messages/dto/create-message-attachment.dto.ts`

- [ ] **Task 3.2**: Xây dựng `MessagesService`
  - **Chi tiết các method**:
    - `findByConversation(currentUserId, conversationId, query)`: Phân trang tin nhắn, ẩn nội dung bị xóa mềm (`deletedAt != null`).
    - `create(currentUserId, conversationId, dto)`:
      - Xử lý Idempotency qua `clientMessageId`.
      - Lưu `Message` và `MessageAttachment`.
      - Cập nhật `Conversation.lastMessageAt`.
      - Chạy trong Prisma `$transaction`.
    - `update(currentUserId, messageId, dto)`: Cập nhật nội dung tin nhắn, gán `editedAt`.
    - `remove(currentUserId, messageId)`: Soft delete tin nhắn (`deletedAt = now()`, `content = null`).
  - **File tác động**: `src/messages/messages.service.ts`

- [ ] **Task 3.3**: Xây dựng `MessagesController`
  - **Chi tiết endpoints**:
    - `GET /api/v1/conversations/:conversationId/messages`
    - `POST /api/v1/conversations/:conversationId/messages`
    - `PATCH /api/v1/messages/:messageId`
    - `DELETE /api/v1/messages/:messageId`
  - **File tác động**: `src/messages/messages.controller.ts`

- [ ] **Task 3.4**: Tạo `MessagesModule` & Đăng ký trong `AppModule`
  - **File tác động**:
    - `src/messages/messages.module.ts`
    - `src/app.module.ts`

---

### 📁 Task Group 4: Chat Attachment Upload (`src/uploads`)

- [ ] **Task 4.1**: Tạo endpoint Upload file đính kèm Chat
  - **Mục tiêu**: Phục vụ upload hình ảnh/tập tin gửi trong tin nhắn.
  - **Chi tiết**:
    - Endpoint: `POST /api/v1/uploads/chat`
    - Interceptor: `FileInterceptor('file')`
    - Validation: File size & Allowed MIME types (`image/*`, `pdf`, `audio/*`, `video/*`).
  - **File tác động**:
    - `src/uploads/uploads.controller.ts`
    - `src/uploads/uploads.service.ts`

---

### ⚡ Task Group 5: Realtime Chat Gateway (`ConversationsGateway`)

- [ ] **Task 5.1**: Cấu hình Socket.IO Gateway & WsGuard
  - **Mục tiêu**: Kết nối WebSocket với xác thực JWT (`auth.token`).
  - **Namespace**: `/chat`
  - **Rooms**: `user:{userId}`, `conversation:{conversationId}`
  - **File tác động**: `src/conversations/conversations.gateway.ts`

- [ ] **Task 5.2**: Xử lý Client Events
  - `conversation:join` (Validate tư cách thành viên trước khi join room)
  - `conversation:leave`
  - `message:send` (Gọi `MessagesService.create` và broadcast event)
  - `typing:start` & `typing:stop` (Broadcast tới room, không lưu DB)
  - `conversation:read`

- [ ] **Task 5.3**: Xử lý Server Broadcast Events
  - `message:new` (Phát sau khi DB transaction commit thành công)
  - `message:updated`
  - `message:deleted`
  - `typing:started` / `typing:stopped`
  - `conversation:read`

---

### 🤝 Task Group 6: Tích hợp tự động khi chấp nhận GuideRequest

- [ ] **Task 6.1**: Gọi `ConversationsService.createForGuideRequest` trong `GuideRequestsService`
  - **Mục tiêu**: Tự động tạo cuộc trò chuyện giữa Tourist và Guide ngay khi `GuideRequest` được chấp nhận.
  - **File tác động**: `src/guide-request/guide-requests.service.ts`

---

### 🧪 Task Group 7: Kiểm thử & Nghiệm thu (Testing & DoD Verification)

- [ ] **Task 7.1**: Viết Unit Tests
  - Test `ConversationsService` (`findAll`, `findOne`, `markAsRead`)
  - Test `MessagesService` (`findByConversation`, `create` idempotency, `update`, `remove`)
  - Test kiểm soát phân quyền Authorization.

- [ ] **Task 7.2**: Viết E2E & WebSocket Tests
  - Test flow: Chấp nhận request -> Tạo conversation -> Gửi/Nhận tin nhắn -> Đọc tin nhắn -> Sửa/Xóa tin nhắn.
  - Test kết nối WebSocket và phát sự kiện realtime.

- [ ] **Task 7.3**: Kiểm tra Definition of Done (DoD)
  - [ ] Migration thành công.
  - [ ] Conversation tự động tạo khi GuideRequest ACCEPTED.
  - [ ] Phân trang tin nhắn và cuộc trò chuyện hoạt động đúng.
  - [ ] Unread count và Read receipt chính xác.
  - [ ] Realtime socket hoạt động trơn tru.
  - [ ] Tất cả unit & E2E tests vượt qua.
