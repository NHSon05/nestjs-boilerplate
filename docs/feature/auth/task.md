# Task Checklist: Feature Authentication (Feature Tasks)

Danh sách nhiệm vụ thực thi chi tiết theo thứ tự triển khai từng bước cho tính năng **Xác thực Người dùng**.

---

## 1. Danh sách công việc (Checklist)

- [ ] **Task 1: DTO Setup & Swagger Annotations**
  - [ ] Kiểm tra `RegisterDto` (`fullName`, `phone`, `email`, `password`, `confirmPassword`, `role`).
  - [ ] Kiểm tra `LoginDto` (`phone`, `password`).
  - [ ] Kiểm tra `RefreshTokenDto` (`refreshToken`).

- [ ] **Task 2: Implement User Registration (`POST /auth/register`)**
  - [ ] Kiểm tra số điện thoại/email tồn tại (ném `ConflictException` nếu trùng).
  - [ ] Hash mật khẩu với `bcrypt`.
  - [ ] Tạo `User` và `TouristProfile`/`GuideProfile` tương ứng.
  - [ ] Sinh cặp `accessToken` & `refreshToken` và lưu bản ghi `RefreshSession`.

- [ ] **Task 3: Implement User Login (`POST /auth/login`)**
  - [ ] Tìm user theo `phone` hoặc `email`.
  - [ ] Kiểm tra mật khẩu qua `bcrypt.compare`.
  - [ ] Sinh cặp Token mới và lưu `RefreshSession`.

- [ ] **Task 4: Implement Token Refresh (`POST /auth/refresh`)**
  - [ ] Verify `refreshToken` signature.
  - [ ] Tìm bản ghi trong `refresh_sessions` theo `tokenHash`.
  - [ ] Kiểm tra `expiresAt` và `revokedAt`.
  - [ ] Xoay Token (Token Rotation): Thu hồi token cũ (`revokedAt = NOW()`), cấp cặp token mới.

- [ ] **Task 5: Implement Logout (`POST /auth/logout`)**
  - [ ] Thu hồi bản ghi `RefreshSession` tương ứng (`revokedAt = NOW()`).

- [ ] **Task 6: Setup Passport JWT Strategy & Guard**
  - [ ] Xây dựng `JwtStrategy` kế thừa `PassportStrategy(Strategy)`.
  - [ ] Xây dựng `JwtAuthGuard` áp dụng cho các route bảo mật.
