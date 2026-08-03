# Specification: Feature Chat (Feature Spec)

Document này mô tả chi tiết yêu cầu kỹ thuật và luồng nghiệp vụ cho tính năng **Chat & Call (Hội thoại, Nhắn tin Realtime, AI Assistant và Gọi điện/Video)** trong ứng dụng.

---

## 1. Tổng quan nghiệp vụ (Business Overview)

Hệ thống Chat cung cấp kênh giao tiếp giữa:
1. **Tourist & Guide**: Nhắn tin trực tiếp 1-1 sau khi yêu cầu hướng dẫn (`GuideRequest`) được chấp nhận (`ACCEPTED`).
2. **User & AI Assistant**: Trợ lý ảo AI hỗ trợ gợi ý lịch trình, địa điểm và thông tin du lịch.
3. **Audio / Video Call**: Cuộc gọi thoại/video trực tiếp giữa Tourist và Guide thông qua WebRTC Provider (Agora/Twilio/Stream).
4. **Đánh giá & Review**: Cho phép Tourist viết đánh giá sau khi chuyến đi hoàn thành (`COMPLETED`).

---

## 2. Luồng nghiệp vụ chi tiết (Business Flows)

### 2.1. Luồng Chat Tourist và Guide
1. Tourist gửi `GuideRequest` cho Guide.
2. Guide duyệt yêu cầu (`GuideRequest.status = ACCEPTED`).
3. Backend tự động khởi tạo:
   - Một bản ghi `Conversation` (`type = GUIDE_REQUEST`).
   - Hai bản ghi `ConversationMember` (cho Tourist và Guide).
4. Backend trả về `conversationId` cho 2 phía.
5. Tourist và Guide mở khung chat, thực hiện trao đổi tin nhắn chữ (TEXT) hoặc hình ảnh (IMAGE).

> **Lưu ý**: Khung chat giữa Tourist và Guide chỉ được khởi tạo khi `GuideRequest` đạt trạng thái `ACCEPTED`.

---

### 2.2. Luồng Chat AI Assistant
1. Người dùng mở ứng dụng và chọn AI Assistant.
2. Hệ thống kiểm tra hoặc khởi tạo `AiConversation`.
3. Người dùng gửi tin nhắn (prompt).
4. Backend lưu tin nhắn của người dùng (`AiMessageRole = USER`).
5. Backend gọi Service AI (Google Gemini API / OpenAI API).
6. Backend lưu kết quả trả về từ AI (`AiMessageRole = ASSISTANT`) và trả về cho client.

---

### 2.3. Luồng Gọi Điện & Gọi Video (Audio/Video Call)
1. User khởi tạo cuộc gọi từ khung chat (`POST /conversations/:id/calls`).
2. Backend tạo `CallRecord` (trạng thái `RINGING`) và tạo RTC Access Token từ Provider (Agora/Twilio/Daily).
3. Backend phát tín hiệu cuộc gọi (Signaling / Push Notification) tới người nhận.
4. Người nhận phản hồi:
   - **Chấp nhận (`ACCEPTED`)**: Hai bên tham gia phòng gọi WebRTC.
   - **Từ chối (`REJECTED`)**: Kết thúc cuộc gọi và lưu lý do.
5. Khi cuộc gọi kết thúc (`ENDED`), Backend cập nhật `endedAt` và `durationSecs`.

---

### 2.4. Luồng Hoàn Thành Chuyến Đi & Đánh Giá (Review)
1. Sau khi chuyến đi diễn ra, Tourist hoặc Guide cập nhật trạng thái chuyến đi thành `COMPLETED` (`PATCH /guide-requests/:id/complete`).
2. Điều kiện viết Review:
   - `currentUser = touristId` (chỉ Tourist được viết review cho Guide).
   - `GuideRequest.status = COMPLETED`.
   - Chưa từng tồn tại review cho `GuideRequest` này.
   - Rating từ 1 đến 5 sao.
3. Tourist gửi đánh giá (`POST /guide-requests/:id/review`).

---

## 3. Danh sách API Specification

Tiền tố chung: `/api/v1`

### 3.1. Danh sách Hội Thoại (Conversations)

#### `GET /api/v1/conversations`
- **Mô tả**: Lấy danh sách cuộc trò chuyện của người dùng hiện tại (kèm tin nhắn mới nhất và số tin chưa đọc).
- **Query Params**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "c1b2c3d4-5678-90ab-cdef-1234567890ab",
      "type": "GUIDE_REQUEST",
      "status": "ACTIVE",
      "otherUser": {
        "id": "u1b2c3d4-5678-90ab-cdef-1234567890ab",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://res.cloudinary.com/..."
      },
      "lastMessage": {
        "id": "m1b2c3d4-5678-90ab-cdef-1234567890ab",
        "type": "TEXT",
        "content": "Xin chào, mình đã nhận được lịch trình.",
        "sentAt": "2026-08-02T09:00:00.000Z"
      },
      "unreadCount": 3
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

#### `GET /api/v1/conversations/:conversationId`
- **Mô tả**: Lấy chi tiết thông tin cuộc trò chuyện.

---

### 3.2. Quản Lý Tin Nhắn (Messages)

#### `GET /api/v1/conversations/:conversationId/messages`
- **Mô tả**: Lấy danh sách lịch sử tin nhắn trong cuộc trò chuyện (phân trang).
- **Query Params**: `page`, `limit`

#### `POST /api/v1/conversations/:conversationId/messages`
- **Mô tả**: Gửi tin nhắn mới (chữ hoặc hình ảnh).
- **Header**: `Authorization: Bearer <token>`
- **Request Body (Chữ)**:
```json
{
  "type": "TEXT",
  "content": "Xin chào, mình đã nhận được lịch trình.",
  "clientMessageId": "mobile-generated-uuid-123"
}
```
- **Request Body (Ảnh)**:
```json
{
  "type": "IMAGE",
  "clientMessageId": "mobile-generated-uuid-456",
  "attachments": [
    {
      "type": "IMAGE",
      "url": "https://res.cloudinary.com/localism/chat/img1.jpg",
      "publicId": "localism/chat/img1",
      "mimeType": "image/jpeg",
      "fileSize": 245000,
      "width": 1080,
      "height": 1350
    }
  ]
}
```
> **Lưu ý**: `clientMessageId` đóng vai trò là Idempotency Key chống gửi trùng lặp dữ liệu khi thiết bị di động thử lại request (retry).

#### `POST /api/v1/uploads/chat`
- **Mô tả**: Upload file đính kèm chat lên Cloudinary.
- **Content-Type**: `multipart/form-data`
- **Response (201 Created)**:
```json
{
  "url": "https://res.cloudinary.com/localism/chat/abc.jpg",
  "publicId": "localism/chat/abc",
  "mimeType": "image/jpeg",
  "fileSize": 245000,
  "width": 1080,
  "height": 1350
}
```

#### `PATCH /api/v1/conversations/:conversationId/read`
- **Mô tả**: Đánh dấu đã đọc tất cả tin nhắn trong cuộc trò chuyện.

#### `PATCH /api/v1/messages/:messageId`
- **Mô tả**: Chỉnh sửa nội dung tin nhắn.

#### `DELETE /api/v1/messages/:messageId`
- **Mô tả**: Hủy / Xóa tin nhắn (Soft delete).

---

### 3.3. Call Endpoints

- `POST /api/v1/conversations/:id/calls`: Khởi tạo cuộc gọi audio/video.
- `PATCH /api/v1/calls/:id/accept`: Chấp nhận cuộc gọi.
- `PATCH /api/v1/calls/:id/reject`: Từ chối cuộc gọi.
- `PATCH /api/v1/calls/:id/end`: Kết thúc cuộc gọi.

---

### 3.4. AI Assistant Endpoints

- `POST /api/v1/ai/conversations`: Tạo đoạn chat AI mới.
- `GET /api/v1/ai/conversations`: Lấy danh sách đoạn chat AI.
- `GET /api/v1/ai/conversations/:id/messages`: Lấy tin nhắn trong đoạn chat AI.
- `POST /api/v1/ai/conversations/:id/messages`: Gửi prompt cho AI.
- `DELETE /api/v1/ai/conversations/:id`: Xóa đoạn chat AI.

---

### 3.5. Review Endpoints

- `PATCH /api/v1/guide-requests/:id/complete`: Đánh dấu chuyến đi hoàn tất.
- `POST /api/v1/guide-requests/:id/review`: Đánh giá hướng dẫn viên sau chuyến đi.

---

## 4. Realtime WebSockets Specifications

Sử dụng NestJS WebSocket Gateway dựa trên **Socket.IO**.

### Các Event chính:
| Event Name | Thuộc tính | Mô tả |
| :--- | :--- | :--- |
| `join_conversation` | Client -> Server | Đăng ký tham gia vào room của `conversationId` |
| `leave_conversation` | Client -> Server | Rời khỏi room |
| `send_message` | Client -> Server | Gửi tin nhắn qua Socket |
| `new_message` | Server -> Client | Phát tin nhắn mới tới toàn bộ member trong room |
| `typing_start` | Client -> Server / Server -> Client | Thông báo đang gõ tin nhắn |
| `typing_stop` | Client -> Server / Server -> Client | Thông báo dừng gõ tin nhắn |
| `message_read` | Server -> Client | Thông báo đối phương đã đọc tin nhắn |
| `conversation_updated` | Server -> Client | Cập nhật danh sách hội thoại |

### Luồng xử lý `send_message` qua WebSocket:
1. Client emit `send_message` kèm payload.
2. Gateway xác thực Socket JWT Token.
3. Kiểm tra User có thuộc `ConversationMember` của hội thoại hay không.
4. Lưu tin nhắn vào Database.
5. Broadcast event `new_message` tới phòng `conversationId`.
6. Cập nhật trường `lastMessageAt` của `Conversation`.
