# Test Plan: Feature Chat (Test Plan)

Document này mô tả chiến lược kiểm thử, kịch bản kiểm thử (Test Cases) và tiêu chí nghiệm thu cho tính năng **Chat & Call**.

---

## 1. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing**: Kiểm thử độc lập các Service method (`ConversationsService`, `MessagesService`, `AiConversationService`).
- **Integration Testing**: Kiểm thử các API Endpoints bằng Supertest / Jest.
- **WebSocket Testing**: Kiểm thử kết nối Realtime Socket.IO client, sự kiện emit/listen.
- **Security & Authorization Testing**: Kiểm thử phân quyền tài khoản (User A không thể xem/gửi tin nhắn trong hội thoại của User B).
- **Idempotency Testing**: Kiểm thử gửi trùng tin nhắn bằng `clientMessageId`.

---

## 2. Kịch bản kiểm thử chi tiết (Test Cases)

### 2.1. Phân Quyền & Bảo Mật (Authorization & Security)
- [ ] **TC-SEC-01**: Khách chưa đăng nhập gửi request tới `/api/v1/conversations` -> Kết quả mong đợi: `401 Unauthorized`.
- [ ] **TC-SEC-02**: User A cố tình lấy lịch sử tin nhắn của hội thoại thuộc User B (`GET /conversations/:id/messages`) -> Kết quả mong đợi: `403 Forbidden`.
- [ ] **TC-SEC-03**: User không phải là Tourist của chuyến đi cố tình tạo Review -> Kết quả mong đợi: `403 Forbidden`.

---

### 2.2. Khởi Tạo Hội Thoại (Conversation Lifecycle)
- [ ] **TC-CONV-01**: Guide chấp nhận yêu cầu (`PATCH /guide-requests/:id/accept`) -> Kết quả mong đợi: `GuideRequest.status = ACCEPTED`, tự động tạo bản ghi `Conversation` và 2 bản ghi `ConversationMember` cho Tourist và Guide.
- [ ] **TC-CONV-02**: Lấy danh sách hội thoại (`GET /conversations?page=1&limit=20`) -> Kết quả mong đợi: Trả về danh sách chứa thông tin người trò chuyện (`otherUser`), tin nhắn cuối (`lastMessage`) và số tin chưa đọc (`unreadCount`).

---

### 2.3. Nhắn Tin & Chống Gửi Trùng (Messaging & Idempotency)
- [ ] **TC-MSG-01**: Gửi tin nhắn dạng chữ hợp lệ -> Kết quả mong đợi: `201 Created`, tin nhắn lưu vào DB và `lastMessageAt` của Conversation được cập nhật.
- [ ] **TC-MSG-02**: Gửi tin nhắn với `clientMessageId` bị lặp lại do sự cố mạng retry -> Kết quả mong đợi: Trả về bản ghi tin nhắn cũ đã tạo trước đó, không sinh bản ghi trùng lặp trong DB.
- [ ] **TC-MSG-03**: Đánh dấu đã đọc (`PATCH /conversations/:id/read`) -> Kết quả mong đợi: `unreadCount` chuyển về 0.

---

### 2.4. Upload Ảnh & Tệp Đính Kèm (Media Attachment)
- [ ] **TC-MEDIA-01**: Upload ảnh đính kèm (`POST /uploads/chat`) -> Kết quả mong đợi: Upload thành công lên Cloudinary, trả về đúng URL và thông tin chiều rộng/chiều cao/dung lượng.
- [ ] **TC-MEDIA-02**: Gửi tin nhắn dạng `IMAGE` kèm danh sách `attachments` -> Kết quả mong đợi: Lưu thành công tin nhắn và bản ghi `MessageAttachment` tương ứng.

---

### 2.5. Realtime WebSockets
- [ ] **TC-WS-01**: Kết nối Socket mà không truyền JWT Token -> Kết quả mong đợi: Socket ngắt kết nối (`Disconnect`).
- [ ] **TC-WS-02**: Client A phát event `send_message` -> Kết quả mong đợi: Client B đang tham gia cùng room nhận được event `new_message` trong thời gian thực.
- [ ] **TC-WS-03**: Client A phát event `typing_start` -> Kết quả mong đợi: Client B nhận được event `typing_start` kèm thông tin `userId`.

---

### 2.6. AI Assistant Chat
- [ ] **TC-AI-01**: Tạo đoạn chat AI mới (`POST /ai/conversations`) -> Kết quả mong đợi: Tạo thành công bản ghi `AiConversation`.
- [ ] **TC-AI-02**: Gửi câu hỏi cho AI (`POST /ai/conversations/:id/messages`) -> Kết quả mong đợi: Lưu bản ghi `AiMessageRole = USER`, gọi Gemini/OpenAI API và lưu câu trả lời `AiMessageRole = ASSISTANT`.

---

### 2.7. Audio / Video Call
- [ ] **TC-CALL-01**: Khởi tạo cuộc gọi (`POST /conversations/:id/calls`) -> Kết quả mong đợi: Tạo `CallRecord` trạng thái `RINGING` và sinh WebRTC Access Token hợp lệ.
- [ ] **TC-CALL-02**: Kết thúc cuộc gọi (`PATCH /calls/:id/end`) -> Kết quả mong đợi: Cập nhật `status = ENDED`, tính toán đúng thời lượng cuộc gọi `durationSecs`.

---

### 2.8. Completing Tour & Review
- [ ] **TC-REV-01**: Đánh dấu chuyến đi hoàn thành (`PATCH /guide-requests/:id/complete`) -> Kết quả mong đợi: Trạng thái chuyến đi đổi thành `COMPLETED`.
- [ ] **TC-REV-02**: Tourist gửi đánh giá hợp lệ (1-5 sao) -> Kết quả mong đợi: Tạo bản ghi `Review`, cập nhật điểm trung bình `averageRating` và `reviewCount` của Guide.
- [ ] **TC-REV-03**: Tourist gửi đánh giá lần 2 cho cùng 1 chuyến đi -> Kết quả mong đợi: Trả về lỗi `409 Conflict`.
