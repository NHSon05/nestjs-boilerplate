# Conversation & Messaging Feature Specification

## 1. Overview

This feature provides chat between a TOURIST and a GUIDE after a GuideRequest is accepted.
Supported capabilities:

- Conversation list and detail
- Text messages
- Image and file attachments
- Reply to message
- Edit and soft-delete message
- Read status and unread count
- Realtime chat with Socket.IO
- Typing indicator
- Call history integration
- Separation from AI conversations

## 2. Business Flow

Tourist sends GuideRequest
→ Guide accepts GuideRequest
→ Backend creates Conversation
→ Backend adds Tourist and Guide as ConversationMember
→ Both users can open the conversation
→ Both users can send text, image, and file messages
→ Both users can start audio/video calls

A Conversation may only be created when:

- GuideRequest.status = ACCEPTED
- The request does not already have a Conversation
- Both Tourist and Guide exist and are active
- The request is not cancelled, rejected, or expired

AI chat is outside this feature and must use separate models such as AiConversation and AiMessage.

## 3. Module Structure

src/
├── conversations/
│ ├── dto/
│ │ ├── get-conversations.dto.ts
│ │ └── mark-conversation-read.dto.ts
│ ├── conversations.controller.ts
│ ├── conversations.service.ts
│ ├── conversations.gateway.ts
│ └── conversations.module.ts
│
├── messages/
│ ├── dto/
│ │ ├── create-message.dto.ts
│ │ ├── get-messages.dto.ts
│ │ ├── update-message.dto.ts
│ │ └── create-message-attachment.dto.ts
│ ├── messages.controller.ts
│ ├── messages.service.ts
│ └── messages.module.ts
│
├── uploads/
├── cloudinary/
├── calls/
└── database/

## 4.REST API

**4.1 Get Conversations**
`GET /conversations`

Example response:

```json
{
  "data": [
    {
      "id": "conversation-uuid",
      "type": "GUIDE_REQUEST",
      "status": "ACTIVE",
      "lastMessageAt": "2026-08-04T06:00:00.000Z",
      "otherUser": {
        "id": "user-uuid",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://..."
      },
      "lastMessage": {
        "id": "message-uuid",
        "type": "TEXT",
        "content": "Xin chào",
        "senderId": "user-uuid",
        "sentAt": "2026-08-04T06:00:00.000Z"
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

**4.2 Get Conversation Detail**
`GET /conversations/:conversationId`

Rules:

- Conversation must exist.
- Current user must be an active member.
- Return conversation metadata, otherUser, and GuideRequest summary.
- Messages are loaded from a separate endpoint.

**4.3 Mark Conversation as Read**
`PATCH /conversations/:conversationId/read`
Rules:

- Current user must be an active member.
- Set ConversationMember.lastReadAt = now().
- Emit conversation:read after persistence succeeds.

**4.4 Get Messages**
`GET /conversations/:conversationId/messages`

Query parameters: limit, cursor, before
Rule:

- Current user must be an active member.
- Return only messages from the target conversation.
- Include sender, attachments, and minimal reply information.
- Soft-deleted messages remain visible with content = null.

**4.5 Send Message**
`POST /conversations/:conversationId/messages`

Text message:

```json
{
  "type": "TEXT",
  "content": "Xin chào, tôi đã nhận được lịch trình.",
  "clientMessageId": "mobile-generated-uuid",
  "replyToId": null
}
```

Image message:

```json
{
  "type": "IMAGE",
  "clientMessageId": "mobile-generated-uuid",
  "attachments": [
    {
      "type": "IMAGE",
      "url": "https://res.cloudinary.com/...",
      "publicId": "localism/chat/abc",
      "fileName": "hoi-an.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 245000,
      "width": 1080,
      "height": 1350
    }
  ]
}
```

Rules:

- Conversation must be ACTIVE.
- Sender must be an active member.
- TEXT requires non-empty content.
- File-based message types require matching attachments.
- replyToId must point to a message in the same conversation.
- clientMessageId provides idempotency.
- Persist message and attachments, then update lastMessageAt in one transaction.
- Emit realtime events only after transaction commit.

**4.6 Edit Message**
`PATCH /messages/:messageId`

```json
{
  "content": "Nội dung đã chỉnh sửa"
}
```

**4.7 Delete Message**
`DELETE /messages/:messageId`

- Only the sender may delete.
- Soft delete only.
- Set deletedAt = now() and content = null.
- Emit message:deleted after update succeeds.

**4.8 Upload Chat Attachment**

`POST /uploads/chat`
`Content-Type: multipart/form-data`

Form field: `file`

Supported MIME types
`image/jpeg`
`image/png`
`image/webp`
`application/pdf`
`audio/mpeg`
`audio/mp4`
`video/mp4`

**4.9 WebSocket Specification**
Namespace: `/chat`

Connection:

```typescript
io('http://localhost:3000/chat', {
  auth: {
    token: accessToken,
  },
  transports: ['websocket'],
});
```

Rooms:
`user:{userId}`
`conversation:{conversationId}`

**Client to Server Events**
conversation:join
conversation:leave
message:send
typing:start
typing:stop
conversation:read

**Server to Client Events**
message:new
message:updated
message:deleted
typing:started
typing:stopped
conversation:read
conversation:updated

Rules:

- Socket authentication uses the access token.
- A user may join a conversation room only when they are an active member.
- Gateway business logic must reuse service methods rather than duplicating database logic.
- Typing events are not persisted.

**4.7 Unread Count**
unreadCount = messages where:

- conversationId matches
- senderId != currentUserId
- sentAt > lastReadAt
- deletedAt IS NULL

When `lastReadAt` is null, count messages after `joinedAt`.

Do not count:

- Messages sent by the current user
- Deleted messages
- Messages created before the user joined

**4.8 Security Rules**

- All REST endpoints use JwtAuthGuard.
- Never accept senderId from the client.
- Derive sender from the access token.
- Only active members may view, send, edit, delete, mark read, or join rooms.
- Validate MIME type and file size.
- Do not trust arbitrary attachment URLs supplied by the client.
- Apply rate limits to message sending and uploads.
- Do not expose sensitive fields of conversation participants.

**4.9 Idempotency**
Frontend generates:
`clientMessageId = UUID`
Database constraint:
@@unique([senderId, clientMessageId])
If the client retries with the same ID, return the existing message instead of creating a duplicate.

**4.10 Transaction Rules**
Message creation flow:
Create Message
→ Create Attachments
→ Update Conversation.lastMessageAt
→ Commit transaction
→ Emit WebSocket events

Never emit before the transaction commits.

**4.12 Acceptance Criteria**
_Conversation_

- Users can list only their own conversations.
- otherUser is correct for Tourist and Guide.
- Last message and unread count are correct.
- Users cannot access another user's conversation.
- A Conversation is created when GuideRequest is accepted.

_Message_

- Text messages can be sent.
- Image messages can be sent.
- Retry does not create duplicate messages.
- Only sender can edit or delete.
- Soft delete works correctly.
- Reply only targets a message from the same conversation.
- Closed conversations reject new messages.

_Realtime_

- New messages arrive without reload.
- Typing indicator works.
- Read receipt works.
- Conversation list updates after new messages.
- Socket requires valid JWT.
- Unauthorized room join is rejected.

**4.13 Testing Requirements**
_Unit Tests_

- ConversationsService.findAll
- ConversationsService.findOne
- ConversationsService.markAsRead
- MessagesService.findByConversation
- MessagesService.create
- MessagesService.update
- MessagesService.remove
- Membership authorization
- Duplicate clientMessageId

_E2E Tests_

- Accept GuideRequest creates Conversation.
- Tourist and Guide can load the same Conversation.
- Text message can be sent.
- Image message can be sent.
- Non-member access is rejected.
- Mark read updates unread count.
- Edit and delete work correctly.
- Closed Conversation rejects new messages.

_WebSocket Tests_

- Valid JWT connects successfully.
- Invalid JWT is disconnected.
- Authorized user joins room.
- Unauthorized join is rejected.
- message:new emits to the correct room.
- Typing event is not echoed to sender.
- Read receipt emits to the other member.

**4.14. Implementation Order**

1. Finalize Prisma models and migration
2. ConversationsService
3. ConversationsController
4. MessagesService
5. MessagesController
6. Cloudinary chat upload
7. Chat Gateway
8. Typing indicator
9. Read receipt
10. Optimize unread count
11. Unit and E2E tests
12. Integrate CallsGateway and Agora

**4.15. API Summary**
`GET    /api/v1/conversations`
`GET    /api/v1/conversations/:conversationId`
`PATCH  /api/v1/conversations/:conversationId/read`

`GET    /api/v1/conversations/:conversationId/messages`
`POST   /api/v1/conversations/:conversationId/messages`

`PATCH  /api/v1/messages/:messageId`
`DELETE /api/v1/messages/:messageId`

`POST   /api/v1/uploads/chat`

**4.16 Definition of Done**
The feature is complete when:

- Migration succeeds.
- Conversation is created after GuideRequest acceptance.
- Tourist and Guide see the same Conversation.
- Text and image messages work.
- Conversation and message pagination work.
- Unread count and read receipt work.
- Realtime messaging works.
- Authorization is enforced.
- Sensitive data is not exposed.
- Core unit and E2E tests pass.
