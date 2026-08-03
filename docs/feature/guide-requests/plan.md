# Implementation Plan: Feature Guide Requests (Feature Plan)

Document này định nghĩa kiến trúc tổng quan và lộ trình triển khai chi tiết từng bước cho tính năng **Quản lý Yêu cầu Hướng dẫn (Guide Requests)**.

---

## 1. Sơ đồ Kiến trúc Hệ thống (System Architecture)

```
[ Tourist ] ──► POST /guide-requests ──► [ GuideRequestsService ]
                                                    │
                                                    ├──► Lưu GuideRequest (PENDING)
                                                    └──► Tạo Notification cho Guide

[ Guide ]   ──► PATCH /accept        ──► [ GuideRequestsService ]
                                                    │
                                                    ├──► Đổi status = ACCEPTED
                                                    ├──► Khởi tạo Conversation & Members
                                                    └──► Tạo Notification cho Tourist
```

---

## 2. Kế hoạch triển khai từng bước (Phased Implementation Strategy)

### Giai đoạn 1: Schema & Data Model Setup
- **Mục tiêu**: Đảm bảo các bảng `guide_requests`, `notifications`, `conversations`, `conversation_members` được liên kết chính xác.
- **Thành phần**: Prisma Model `GuideRequest`, Enum `GuideRequestStatus` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`).

### Giai đoạn 2: API Tạo Yêu cầu & Truy vấn
- **Mục tiêu**: Xây dựng API gửi yêu cầu và xem danh sách phân trang.
- **Thành phần**: `GuideRequestsModule`, `GuideRequestsController`, `GuideRequestsService`.
- **Tối ưu hóa**: Loại bỏ truy vấn dư thừa `user.findUnique`, sử dụng `user.role` từ JWT Payload và tận dụng chỉ mục `@@index([guideId, status, createdAt])`, `@@index([touristId, status, createdAt])`.

### Giai đoạn 3: Phản hồi Yêu cầu & Tạo Conversation Tự động
- **Mục tiêu**: Xử lý chấp nhận (`ACCEPT`), từ chối (`REJECT`) và hủy (`CANCEL`).
- **Logic quan trọng**:
  - Khi Guide `ACCEPT`: Tự động gán `acceptedAt = now()`, mở `Conversation` và gán 2 `ConversationMember`.
  - Khi Guide `REJECT`: Tự động gán `rejectedAt = now()` và lưu `rejectionReason`.
  - Khi User/Guide `CANCEL`: Tự động gán `cancelledAt = now()` và đóng `Conversation` nếu có.

### Giai đoạn 4: Tích hợp Hệ thống Thông báo (Notification Integration)
- **Mục tiêu**: Gửi thông báo trong ứng dụng (`IN_APP`) cho từng bước chuyển đổi yêu cầu.

---

## 3. Kiểm soát Chuyển đổi Trạng thái (State Machine Guard)

Bắt buộc triển khai phương thức kiểm tra tính hợp lệ của luồng chuyển đổi trạng thái trước khi lưu xuống database:
```typescript
private validateStateTransition(currentStatus: GuideRequestStatus, targetStatus: GuideRequestStatus) {
  const allowedTransitions: Record<GuideRequestStatus, GuideRequestStatus[]> = {
    [GuideRequestStatus.PENDING]: [GuideRequestStatus.ACCEPTED, GuideRequestStatus.REJECTED, GuideRequestStatus.CANCELLED],
    [GuideRequestStatus.ACCEPTED]: [GuideRequestStatus.CANCELLED, GuideRequestStatus.COMPLETED],
    [GuideRequestStatus.REJECTED]: [],
    [GuideRequestStatus.CANCELLED]: [],
    [GuideRequestStatus.COMPLETED]: [],
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    throw new ConflictException(`Không thể chuyển trạng thái từ ${currentStatus} sang ${targetStatus}`);
  }
}
```
