# Implementation Plan: Conversation & Messaging Feature

## 1. Overview

Dựa trên tài liệu yêu cầu `docs/feature/messages/spec.md`, kế hoạch này chi tiết hóa các bước thực hiện tính năng Trò chuyện & Tin nhắn (Conversation & Messaging) giữa **Tourist** và **Guide** sau khi một **GuideRequest** được chấp nhận (`ACCEPTED`).

> [!NOTE]
> Yêu cầu công việc: Chỉ tạo file kế hoạch `plan.md`, không thay đổi bất kỳ file code nguồn nào trong dự án.

---

## 2. Kiến trúc Module & Cấu trúc thư mục

Tạo mới module `messages` và hoàn thiện module `conversations`:

```
src/
├── conversations/
│   ├── dto/
│   │   ├── get-conversations.dto.ts
│   │   └── mark-conversation-read.dto.ts
│   ├── conversations.controller.ts
│   ├── conversations.service.ts
│   ├── conversations.gateway.ts
│   └── conversations.module.ts
│
├── messages/
│   ├── dto/
│   │   ├── create-message.dto.ts
│   │   ├── get-messages.dto.ts
│   │   ├── update-message.dto.ts
│   │   └── create-message-attachment.dto.ts
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   └── messages.module.ts
│
└── uploads/
    ├── uploads.controller.ts
    ├── uploads.service.ts
    └── uploads.module.ts
```

---

## 3. Các bước triển khai chi tiết (Implementation Phases)

### Phase 1: Database & Prisma Schema Verification

- Kiểm tra các model đã có sẵn trong `prisma/schema.prisma`:
  - `Conversation`, `ConversationMember`, `Message`, `MessageAttachment`.
- Xác nhận các ràng buộc dữ liệu:
  - `Message`: Ràng buộc `@@unique([senderId, clientMessageId])` để đảm bảo tính Idempotency khi retry gửi tin nhắn.
  - Index: `@@index([conversationId, sentAt])` hỗ trợ phân trang tin nhắn nhanh chóng.
- Chạy `npx prisma generate` nếu cần cập nhật Prisma Client.

---

### Phase 2: Conversations Module (`src/conversations`)

- **DTOs**:
  - `GetConversationsDto`: Phân trang (`page`, `limit`), lọc theo `status`, tìm kiếm theo `keyword`.
- **ConversationsService**:
  - `findAll(currentUserId, query)`: Lấy danh sách hội thoại của user hiện tại, tính toán `otherUser`, `lastMessage`, và `unreadCount` chuẩn xác.
  - `findOne(currentUserId, conversationId)`: Lấy chi tiết cuộc trò chuyện và kiểm tra quyền active member (`ForbiddenException` nếu không thuộc hội thoại).
  - `markAsRead(currentUserId, conversationId)`: Cập nhật `ConversationMember.lastReadAt = now()`.
  - `assertActiveMember(currentUserId, conversationId)`: Helper tái sử dụng để kiểm tra tư cách thành viên.
  - `createForGuideRequest(guideRequestId, touristId, guideId)`: Tạo tự động Conversation & 2 Member khi GuideRequest chuyển sang trạng thái `ACCEPTED`.
- **ConversationsController**:
  - `GET /api/v1/conversations` (Lấy danh sách)
  - `GET /api/v1/conversations/:conversationId` (Chi tiết hội thoại)
  - `PATCH /api/v1/conversations/:conversationId/read` (Đánh dấu đã đọc)

---

### Phase 3: Messages Module (`src/messages`)

- **DTOs**:
  - `CreateMessageDto`: `type` (`TEXT` | `IMAGE` | `FILE` | `LOCATION` | `SYSTEM`), `content`, `clientMessageId`, `replyToId`, `attachments`.
  - `GetMessagesDto`: Phân trang dạng cursor (`limit`, `cursor`, `before`).
  - `UpdateMessageDto`: `content` (chỉnh sửa tin nhắn).
  - `CreateMessageAttachmentDto`: `url`, `publicId`, `fileName`, `mimeType`, `fileSize`, `width`, `height`, `duration`.
- **MessagesService**:
  - `findByConversation(currentUserId, conversationId, query)`: Lấy danh sách tin nhắn theo hội thoại (nếu tin nhắn bị xóa mềm `deletedAt != null`, trả về `content: null`).
  - `create(currentUserId, conversationId, dto)`:
    - Kiểm tra `clientMessageId` (nếu đã tồn tại tin nhắn trùng `senderId` + `clientMessageId`, trả về tin nhắn cũ mà không tạo mới).
    - Tạo `Message` và các `MessageAttachment`.
    - Cập nhật `Conversation.lastMessageAt`.
    - Thực thi trong 1 Prisma `$transaction`.
  - `update(currentUserId, messageId, dto)`: Cho phép người gửi chỉnh sửa nội dung, cập nhật `editedAt`.
  - `remove(currentUserId, messageId)`: Soft delete (`deletedAt = now()`, `content = null`). Chỉ người gửi mới có quyền.
- **MessagesController**:
  - `GET /api/v1/conversations/:conversationId/messages`
  - `POST /api/v1/conversations/:conversationId/messages`
  - `PATCH /api/v1/messages/:messageId`
  - `DELETE /api/v1/messages/:messageId`

---

### Phase 4: Chat Attachment Upload (`src/uploads` hoặc `src/cloudinary`)

- Endpoint: `POST /api/v1/uploads/chat` (`multipart/form-data`)
- Validation:
  - Giới hạn dung lượng file (Image <= 10MB, File/Audio/Video <= 50MB).
  - Kiểm tra MIME types hợp lệ: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `audio/mpeg`, `audio/mp4`, `video/mp4`.
- Upload lên Cloudinary folder `localism/chat` thông qua `CloudinaryService`.

---

### Phase 5: Realtime Chat Gateway (`ConversationsGateway`)

- Namespace: `/chat`
- Authentication: Authenticate socket connection qua JWT Token (`client.handshake.auth.token`).
- Rooms:
  - `user:{userId}`
  - `conversation:{conversationId}`
- Event Handlers (Client -> Server):
  - `conversation:join`: User tham gia room socket của hội thoại (kiểm tra quyền active member trước khi `join`).
  - `conversation:leave`: Rời khỏi room socket.
  - `message:send`: Gửi tin nhắn qua Socket (gọi `MessagesService.create` rồi phát event tới room).
  - `typing:start` / `typing:stop`: Phát trạng thái đang gõ phím cho đối phương (không lưu DB).
  - `conversation:read`: Đánh dấu đã đọc qua socket.
- Emission (Server -> Client):
  - `message:new`: Broadcast tin nhắn mới tới room sau khi DB transaction commit thành công.
  - `message:updated`: Phát sự kiện khi tin nhắn được sửa.
  - `message:deleted`: Phát sự kiện khi tin nhắn bị xóa.
  - `typing:started` / `typing:stopped`: Thông báo gõ phím tới thành viên khác.
  - `conversation:read`: Thông báo đã đọc tới thành viên còn lại.

---

### Phase 6: Tích hợp tự động với GuideRequest

- Trong `GuideRequestsService.acceptRequest`:
  - Thêm logic gọi `ConversationsService.createForGuideRequest` để tạo hội thoại ngay khi Guide chấp nhận yêu cầu của Tourist.

---

### Phase 7: Tối ưu Unread Count & Bảo mật

- **Unread Count Rule**:
  - Đếm số tin nhắn có `sentAt > lastReadAt` (hoặc `joinedAt` nếu `lastReadAt` null), `senderId != currentUserId`, và `deletedAt IS NULL`.
- **Security Rules**:
  - Không bao giờ nhận `senderId` từ client; lấy trực tiếp từ JWT.
  - Chỉ thành viên active của Conversation mới được xem, gửi, sửa, xóa hoặc join socket room.
  - Áp dụng Rate Limiting cho API gửi tin nhắn và upload file.

---

## 4. Danh sách Endpoint API

| Method   | Endpoint                                         | Description                                  |
| :------- | :----------------------------------------------- | :------------------------------------------- |
| `GET`    | `/api/v1/conversations`                          | Lấy danh sách cuộc trò chuyện                |
| `GET`    | `/api/v1/conversations/:conversationId`          | Lấy chi tiết cuộc trò chuyện                 |
| `PATCH`  | `/api/v1/conversations/:conversationId/read`     | Đánh dấu đã đọc cuộc trò chuyện              |
| `GET`    | `/api/v1/conversations/:conversationId/messages` | Lấy danh sách tin nhắn trong cuộc trò chuyện |
| `POST`   | `/api/v1/conversations/:conversationId/messages` | Gửi tin nhắn mới (Text / Image / File)       |
| `PATCH`  | `/api/v1/messages/:messageId`                    | Sửa tin nhắn đã gửi                          |
| `DELETE` | `/api/v1/messages/:messageId`                    | Xóa mềm tin nhắn                             |
| `POST`   | `/api/v1/uploads/chat`                           | Upload file/ảnh đính kèm cho chat            |

---

## 5. Chiến lược Kiểm thử (Testing Strategy)

1. **Unit Tests**:
   - `ConversationsService`: `findAll`, `findOne`, `markAsRead`.
   - `MessagesService`: `findByConversation`, `create` (test idempotency với `clientMessageId`), `update`, `remove`.
   - Check quy tắc Authorization (Không cho phép user bên ngoài truy cập).

2. **E2E Tests**:
   - Chấp nhận GuideRequest tạo Conversation tự động.
   - Gửi và nhận tin nhắn văn bản / hình ảnh.
   - Chức năng đánh dấu đã đọc làm giảm `unreadCount`.
   - Sửa/Xóa tin nhắn.

3. **WebSocket Tests**:
   - Kết nối thành công với JWT hợp lệ, từ chối kết nối khi JWT sai.
   - Phát sự kiện `message:new`, `typing:started`, `conversation:read` đúng room.

---

## 6. Definition of Done (DoD)

- [ ] Chạy migration / sinh Prisma Client thành công.
- [ ] Tự động tạo Conversation khi GuideRequest chuyển sang `ACCEPTED`.
- [ ] Tourist và Guide cùng nhìn thấy một Conversation duy nhất.
- [ ] Gửi/nhận tin nhắn Text và Image hoạt động ổn định.
- [ ] Phân trang danh sách hội thoại và danh sách tin nhắn hoạt động chính xác.
- [ ] Tính toán `unreadCount` và thông báo đã đọc (read receipt) chính xác.
- [ ] Giao tiếp Realtime qua Socket.IO hoạt động tốt (tin nhắn mới, gõ phím, đọc tin).
- [ ] Kiểm soát phân quyền Authorization chặt chẽ (chỉ member mới có quyền).
- [ ] Các bộ unit test & E2E test cốt lõi đạt trạng thái PASS.
