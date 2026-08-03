# Implementation Plan: Feature Chat (Feature Plan)

Document này định nghĩa kế hoạch kiến trúc và lộ trình triển khai từng bước cho tính năng **Chat & Call**.

---

## 1. Mạch kiến trúc hệ thống (System Architecture)

```
[ Mobile / Web Client ]
       │
       ├──── REST API (HTTPS) ─────────► [ NestJS Controllers ]
       │                                         │
       ├──── WebSockets (WSS/Socket.IO) ──► [ Chat Gateway ]
       │                                         │
       ▼                                         ▼
[ Cloudinary Media Storage ]           [ Prisma ORM / PostgreSQL ]
                                                 │
                                       [ External Providers ]
                                       ├── AI (Gemini/OpenAI)
                                       └── WebRTC (Agora/Twilio)
```

---

## 2. Các giai đoạn triển khai (Phased Rollout Strategy)

Thứ tự ưu tiên triển khai được phân bổ theo nguyên tắc: **Xây dựng Chat cơ bản trước -> Realtime -> Tệp đính kèm -> AI Assistant -> Gọi thoại/video -> Đánh giá sau chuyến đi**.

---

### Giai đoạn 1: Cơ sở dữ liệu & Model Foundations

- **Mục tiêu**: Định nghĩa và migrate toàn bộ Schema Prisma liên quan đến Chat.
- **Thành phần**:
  - Models: `Conversation`, `ConversationMember`, `Message`, `MessageAttachment`, `CallRecord`, `Review`.
  - Enums: `ConversationType`, `MessageType`, `CallType`, `CallStatus`, `AttachmentType`, `ConversationStatus`.
  - Indexing: `[conversationId, sentAt]`, `[senderId, clientMessageId]`, `[guideRequestId]`.

---

### Giai đoạn 2: RESTful API Layer (Conversation & Messages)

- **Mục tiêu**: Cung cấp các API HTTP cho ứng dụng di động truy vấn danh sách hội thoại và lịch sử tin nhắn.
- **APIs**:
  - `GET /api/v1/conversations` (Tính số tin nhắn chưa đọc `unreadCount`, tin nhắn mới nhất `lastMessage`).
  - `GET /api/v1/conversations/:id`
  - `GET /api/v1/conversations/:id/messages`
  - `POST /api/v1/conversations/:id/messages` (Xử lý chống trùng bằng `clientMessageId`).
  - `PATCH /api/v1/conversations/:id/read`

---

### Giai đoạn 3: WebSocket Realtime Engine (Socket.IO)

- **Mục tiêu**: Xây dựng Gateway xử lý giao tiếp thời gian thực.
- **Thành phần**:
  - `ChatGateway` trang bị NestJS `@WebSocketGateway`.
  - Socket Authentication Middleware (Xác thực JWT Token khi handshake).
  - Room Management (`socket.join(conversationId)`).
  - Event Handlers: `join_conversation`, `send_message`, `typing_start`, `typing_stop`, `message_read`.

---

### Giai đoạn 4: Quản lý File & Upload Ảnh (Media Attachments)

- **Mục tiêu**: Hỗ trợ gửi hình ảnh và tệp đính kèm trong khung chat.
- **Thành phần**:
  - Tích hợp Cloudinary Storage Module.
  - Endpoint `POST /api/v1/uploads/chat` cho phép upload ảnh nhận về metadata (URL, publicId, dimensions, size).
  - Cập nhật DTO tin nhắn hỗ trợ `MessageAttachment`.

---

### Giai đoạn 5: Tích hợp AI Assistant Chat

- **Mục tiêu**: Cung cấp tính năng trợ lý ảo tư vấn du lịch tự động.
- **Thành phần**:
  - `AiConversationModule` & `AiService`.
  - Tích hợp SDK Google Gemini (`@google/genai`) hoặc OpenAI.
  - Lưu vết lịch sử trao đổi giữa User và AI Assistant.

---

### Giai đoạn 6: Tích hợp Audio & Video Call Provider

- **Mục tiêu**: Cho phép gọi thoại và gọi video trực tiếp.
- **Thành phần**:
  - Chọn và cấu hình WebRTC Provider (Agora / Twilio Video / Stream / Daily).
  - Backend sinh Access Token ngắn hạn cho phòng gọi.
  - Lưu vết thông tin cuộc gọi vào `CallRecord`.

---

### Giai đoạn 7: Đánh giá & Review Sau Chuyến Đi

- **Mục tiêu**: Quản lý vòng đời chuyến đi và cho phép đánh giá chất lượng Hướng dẫn viên.
- **Thành phần**:
  - Endpoint `PATCH /api/v1/guide-requests/:id/complete`.
  - Endpoint `POST /api/v1/guide-requests/:id/review`.
  - Kiểm tra ràng buộc điều kiện (`status = COMPLETED`, chỉ Tourist được review 1 lần).

---

## 3. Các yêu cầu phi chức năng (Non-Functional Requirements)

1. **Tính Idempotency (Chống trùng lặp tin nhắn)**:
   Mọi request gửi tin nhắn từ client bắt buộc chứa `clientMessageId`. Database thiết lập `@unique([senderId, clientMessageId])` để đảm bảo nếu mạng chập chờn retry request cũng không tạo duplicate message.
2. **Bảo mật & Phân quyền (Security & Authorization)**:
   Mọi endpoint và WebSocket event liên quan đến `conversationId` bắt buộc phải thông qua Guard kiểm tra người dùng hiện tại có nằm trong `ConversationMember` hay không.
3. **Hiệu năng & Phân trang (Performance)**:
   Tất cả API lấy danh sách tin nhắn và danh sách hội thoại đều được phân trang (`page`, `limit`) và được đánh index tối ưu theo `sentAt DESC`.
