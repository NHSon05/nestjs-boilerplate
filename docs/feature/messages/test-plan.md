# Test Plan: Conversation & Messaging Feature

> **Tài liệu liên quan**:
> - Specification: [spec.md](file:///Users/nguyenhongson/Documents/Learning/nestjs-boilerplate/docs/feature/messages/spec.md)
> - Implementation Plan: [plan.md](file:///Users/nguyenhongson/Documents/Learning/nestjs-boilerplate/docs/feature/messages/plan.md)
> - Tasks Breakdown: [tasks.md](file:///Users/nguyenhongson/Documents/Learning/nestjs-boilerplate/docs/feature/messages/tasks.md)

---

## 1. Mục tiêu Kiểm thử (Testing Objectives)

Kế hoạch kiểm thử này nhằm đảm bảo tính năng Trò chuyện & Gửi tin nhắn (Conversation & Messaging) hoạt động chính xác, ổn định và bảo mật trên các khía cạnh:

1. **Chức năng (Functional)**: Kiểm tra các luồng nghiệp vụ tạo cuộc trò chuyện, gửi/nhận tin nhắn văn bản, hình ảnh, tập tin, sửa/xóa tin nhắn và đánh dấu đã đọc.
2. **Realtime (WebSocket)**: Xác minh kết nối Socket.IO, phân quyền join room, sự kiện gõ phím (`typing`), gửi nhận tin nhắn tức thì (`message:new`) và cập nhật trạng thái đọc.
3. **Bảo mật (Security & Authorization)**: Đảm bảo chỉ thành viên trong cuộc trò chuyện mới có quyền truy cập, chống mạo danh `senderId`, xác thực JWT chặt chẽ.
4. **Tính nhất quán & Chống trùng lặp (Idempotency)**: Đảm bảo việc thử lại (`retry`) với cùng `clientMessageId` không tạo ra tin nhắn trùng lặp.

---

## 2. Phạm vi Kiểm thử (Test Scope)

### Trong phạm vi (In Scope):
- **ConversationsService & Controller**: Lấy danh sách hội thoại, chi tiết hội thoại, đánh dấu đã đọc.
- **MessagesService & Controller**: Lấy danh sách tin nhắn (phân trang cursor), gửi tin nhắn (`TEXT`, `IMAGE`, `FILE`), chỉnh sửa và xóa mềm (`soft delete`).
- **Attachment Upload**: Upload file/ảnh chat qua Cloudinary.
- **ConversationsGateway (Socket.IO `/chat`)**: Kết nối JWT, join/leave room, broadcast tin nhắn mới, typing indicator, read receipt.
- **GuideRequest Integration**: Tự động tạo `Conversation` khi `GuideRequest` chuyển sang `ACCEPTED`.

### Ngoài phạm vi (Out of Scope):
- AI Chat (mô hình `AiConversation` & `AiMessage` độc lập).
- Tích hợp dịch vụ thanh toán hoặc cuộc gọi video Agora nâng cao.

---

## 3. Danh sách Kịch bản Test Chi tiết (Test Cases)

### 3.1 Unit Tests (Service Layer)

#### A. ConversationsService Unit Tests
| ID | Kịch bản Test | Đầu vào (Inputs) | Kết quả kỳ vọng (Expected Output) |
| :--- | :--- | :--- | :--- |
| **UT-CONV-01** | `findAll`: Lấy danh sách cuộc trò chuyện của user | `currentUserId = UserA`, `query = { page: 1, limit: 20 }` | Trả về danh sách cuộc trò chuyện thuộc UserA, bao gồm `otherUser`, `lastMessage`, và `unreadCount` chính xác. |
| **UT-CONV-02** | `findAll`: Tìm kiếm hội thoại theo `keyword` | `keyword = "Nguyen"` | Chỉ trả về các hội thoại có tên đối phương chứa "Nguyen". |
| **UT-CONV-03** | `findOne`: Lấy chi tiết hội thoại thành công | `currentUserId = UserA`, `conversationId = Conv1` | Trả về thông tin chi tiết hội thoại `Conv1` và thông tin `GuideRequest`. |
| **UT-CONV-04** | `findOne`: Từ chối user không thuộc hội thoại | `currentUserId = UserC` (không thuộc Conv1) | Ném ngoại lệ `ForbiddenException('Bạn không thuộc cuộc trò chuyện này')`. |
| **UT-CONV-05** | `findOne`: Không tìm thấy hội thoại | `conversationId = InvalidUUID` | Ném ngoại lệ `NotFoundException('Không tìm thấy cuộc trò chuyện')`. |
| **UT-CONV-06** | `markAsRead`: Đánh dấu đã đọc thành công | `currentUserId = UserA`, `conversationId = Conv1` | Cập nhật `ConversationMember.lastReadAt = now()` và trả về thông báo thành công. |
| **UT-CONV-07** | `createForGuideRequest`: Tự động tạo hội thoại khi chấp nhận | `guideRequestId = Req1`, `touristId = TouristA`, `guideId = GuideB` | Tạo 1 bản ghi `Conversation` và 2 bản ghi `ConversationMember`. |

#### B. MessagesService Unit Tests
| ID | Kịch bản Test | Đầu vào (Inputs) | Kết quả kỳ vọng (Expected Output) |
| :--- | :--- | :--- | :--- |
| **UT-MSG-01** | `findByConversation`: Lấy danh sách tin nhắn thành công | `conversationId = Conv1`, `limit = 20` | Trả về danh sách tin nhắn của `Conv1` kèm thông tin sender và attachments. |
| **UT-MSG-02** | `findByConversation`: Hiển thị tin nhắn bị xóa mềm | Đã có 1 tin nhắn bị `deletedAt != null` | Tin nhắn bị xóa có `content = null` và `deletedAt != null`. |
| **UT-MSG-03** | `create`: Gửi tin nhắn Text thành công | `type = TEXT`, `content = "Xin chào"`, `clientMessageId = UUID1` | Tạo tin nhắn trong DB, cập nhật `Conversation.lastMessageAt`. |
| **UT-MSG-04** | `create`: Kiểm tra Idempotency với `clientMessageId` | Gửi lại cùng `senderId` + `clientMessageId = UUID1` | Trả về tin nhắn đã tạo trước đó, KHÔNG tạo bản ghi mới trong DB. |
| **UT-MSG-05** | `create`: Gửi tin nhắn trả lời (`replyToId`) | `replyToId = Message1` (cùng Conv) | Tin nhắn được liên kết với `replyToId` chính xác. |
| **UT-MSG-06** | `create`: Từ chối `replyToId` thuộc hội thoại khác | `replyToId = MessageFromOtherConv` | Ném ngoại lệ `BadRequestException`. |
| **UT-MSG-07** | `update`: Người gửi chỉnh sửa tin nhắn | `currentUserId = SenderA`, `content = "Nội dung mới"` | Nội dung tin nhắn thay đổi, cập nhật `editedAt = now()`. |
| **UT-MSG-08** | `update`: Từ chối người không phải người gửi sửa | `currentUserId = UserB` (không phải người gửi) | Ném ngoại lệ `ForbiddenException`. |
| **UT-MSG-09** | `remove`: Xóa mềm tin nhắn bởi người gửi | `currentUserId = SenderA` | Gán `deletedAt = now()` và `content = null`. |

---

### 3.2 REST API Integration / E2E Tests

| ID | Endpoint | Method | Kịch bản Test | Result Kì Vọng |
| :--- | :--- | :--- | :--- | :--- |
| **E2E-API-01** | `/api/v1/conversations` | `GET` | Không gửi Token JWT | `401 Unauthorized` |
| **E2E-API-02** | `/api/v1/conversations` | `GET` | Gửi Token hợp lệ | `200 OK`, danh sách hội thoại của user |
| **E2E-API-03** | `/api/v1/conversations/:id` | `GET` | Thành viên truy cập hội thoại | `200 OK`, dữ liệu chi tiết |
| **E2E-API-04** | `/api/v1/conversations/:id` | `GET` | User khác truy cập | `403 Forbidden` |
| **E2E-API-05** | `/api/v1/conversations/:id/read` | `PATCH` | Đánh dấu đã đọc thành công | `200 OK`, `lastReadAt` cập nhật |
| **E2E-API-06** | `/api/v1/conversations/:id/messages` | `POST` | Gửi tin nhắn Text | `201 Created`, tin nhắn được tạo |
| **E2E-API-07** | `/api/v1/conversations/:id/messages` | `POST` | Gửi tin nhắn thiếu content | `400 Bad Request` |
| **E2E-API-08** | `/api/v1/messages/:id` | `PATCH` | Người gửi sửa nội dung | `200 OK`, `editedAt` được cập nhật |
| **E2E-API-09** | `/api/v1/messages/:id` | `DELETE` | Người gửi xóa tin nhắn | `200 OK`, tin nhắn chuyển soft delete |
| **E2E-API-10** | `/api/v1/uploads/chat` | `POST` | Upload file ảnh hợp lệ (`.jpg`, `< 10MB`) | `201 Created`, trả về URL Cloudinary |
| **E2E-API-11** | `/api/v1/uploads/chat` | `POST` | Upload file không hợp lệ (`.exe`) | `400 Bad Request` |

---

### 3.3 WebSocket Realtime Tests (`ConversationsGateway`)

| ID | Sự kiện (Event) | Kịch bản Test | Kết quả kỳ vọng |
| :--- | :--- | :--- | :--- |
| **WS-01** | `Connection` | Kết nối Socket với `auth.token` hợp lệ | Kết nối thành công, Socket ID gắn liền với `userId`. |
| **WS-02** | `Connection` | Kết nối Socket thiếu/sai Token JWT | Ngắt kết nối ngay lập tức (`Disconnect`). |
| **WS-03** | `conversation:join` | Member của Conversation join room | Socket tham gia room `conversation:{conversationId}` thành công. |
| **WS-04** | `conversation:join` | User ngoài join room | Từ chối join room, trả về thông báo lỗi phân quyền. |
| **WS-05** | `message:send` | Gửi tin nhắn qua WebSocket | Tin nhắn lưu vào DB, broadcast event `message:new` tới tất cả thành viên trong room. |
| **WS-06** | `typing:start` | UserA bắt đầu gõ phím | Broadcast event `typing:started` tới UserB trong room (không gửi lại UserA). |
| **WS-07** | `typing:stop` | UserA dừng gõ phím | Broadcast event `typing:stopped` tới UserB. |
| **WS-08** | `conversation:read` | UserB phát sự kiện đã đọc | Broadcast event `conversation:read` để UserA nhận thông báo đã đọc tức thì. |

---

### 3.4 Security & Boundary Tests (Kiểm thử Bảo mật & Ranh giới)

1. **Sender Impersonation Test**: 
   - Đảm bảo client không thể truyền `senderId` trong Body request nhằm giả mạo người gửi. `senderId` luôn được trích xuất từ Token JWT.
2. **Idempotency Under Concurrent Requests**:
   - Gửi đồng thời 5 request `POST /messages` với cùng `clientMessageId`. Đảm bảo hệ thống chỉ tạo **1 tin nhắn duy nhất** trong DB và trả về cùng thông tin cho cả 5 request.
3. **Soft Delete Privacy**:
   - Kiểm tra tin nhắn bị xóa mềm không vô tình bị rò rỉ nội dung cũ qua API lấy danh sách tin nhắn.

---

## 4. Quy trình Thực thi Test (Execution Commands)

Chạy các bộ kiểm thử tự động với các lệnh sau:

```bash
# 1. Chạy Unit Tests cho tính năng Messages & Conversations
npm run test src/conversations src/messages

# 2. Chạy E2E Tests
npm run test:e2e

# 3. Kiểm tra Coverage của mã nguồn
npm run test:cov
```

---

## 5. Tiêu chí Đạt (Pass Criteria / Definition of Done for Testing)

- [ ] **Unit Test Coverage**: Đạt tối thiểu 85% code coverage cho `ConversationsService` và `MessagesService`.
- [ ] **All Integration Tests Pass**: 100% các kịch bản REST API và WebSocket đạt kết quả PASS.
- [ ] **No Security Leaks**: Không có rò rỉ dữ liệu giữa các hội thoại của các user khác nhau.
- [ ] **Idempotency Confirmed**: Không sinh tin nhắn trùng lặp khi mạng bị gián đoạn và retry.
