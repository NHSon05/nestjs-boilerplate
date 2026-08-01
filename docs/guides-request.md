# Requirement: File này chỉ thực hiện mô tả flow của feature Guide-request. Không thực hiện thay đổi gì ở trong code

## FLow nghiệp vụ của feature guide request

### Luồng nghiệp vụ

Tourist xem Guide Profile
→ gửi Guide Request
→ Guide nhận notification
→ Guide Accept hoặc Deny
→ nếu Accept:
tạo Conversation
thêm Tourist và Guide vào ConversationMember
mở khung chat
→ nếu Deny:
không tạo Conversation
→ nếu Tourist Cancel:
không tạo Conversation

**Bước 1: Guide Request**

Thực hiện xây dựng các API

`POST /guide-requests`
`GET /guide-requests/me`
`PATCH /guide-requests/:id/accept`
`PATCH /guide-requests/:id/reject`
`PATCH /guide-requests/:id/cancel`

**Bước 2: Notification**
Khi Tourist gửi request:
`Tạo GuideRequest`
`→ tạo Notification cho Guide`
Notification chỉ cần lưu vào database trước. Push notification có thể làm sau.

**Bước 3: Conversation**
Khi guide `ACCEPT`
GuideRequest.status = ACCEPTED
→ tạo Conversation
→ tạo 2 ConversationMember
→ trả conversationId

**Bước 4: Message và WebSocket**
Sau khi đã có conversation:
`GET /conversations`
`GET /conversations/:id/messages`
`POST /conversations/:id/messages`
`WebSocket: send_message`
`WebSocket: new_message`

Luồng hợp lệ:
`PENDING → ACCEPTED`
`PENDING → REJECTED`
`PENDING → CANCELLED`

`ACCEPTED → CANCELLED`
`ACCEPTED → COMPLETED`
Không hợp lệ:
`REJECTED → ACCEPTED`
`CANCELLED → ACCEPTED`
`COMPLETED → PENDING`
Service phải kiểm tra state trước khi đổi.
