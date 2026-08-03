# Test Plan: Feature Authentication (Test Plan)

Document này mô tả chiến lược kiểm thử, kịch bản kiểm thử (Test Cases) và tiêu chí nghiệm thu cho tính năng **Xác thực Người dùng**.

---

## 1. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing**: Kiểm thử độc lập `AuthService` (đăng ký, đăng nhập, xoay token, đăng xuất).
- **Integration & E2E Testing**: Kiểm thử toàn bộ API Endpoints với database thực tế, mã hóa bcrypt và Passport JWT Guard.
- **Security Testing**: Kiểm thử Token expiry, Token reuse detection và bảo mật Refresh Session.

---

## 2. Kịch bản kiểm thử chi tiết (Test Cases)

### 2.1. Đăng ký tài khoản (Register)
- [ ] **TC-AUTH-REG-01**: Đăng ký tài khoản mới với dữ liệu hợp lệ -> Trả về `201 Created` kèm `user`, `accessToken` và `refreshToken`.
- [ ] **TC-AUTH-REG-02**: Đăng ký với số điện thoại hoặc email đã tồn tại -> Trả về lỗi `409 Conflict`.
- [ ] **TC-AUTH-REG-03**: Đăng ký với `confirmPassword` không khớp `password` -> Trả về lỗi `400 Bad Request`.

### 2.2. Đăng nhập (Login)
- [ ] **TC-AUTH-LOG-01**: Đăng nhập với số điện thoại và mật khẩu chính xác -> Trả về `200 OK` kèm `user` và cặp Token.
- [ ] **TC-AUTH-LOG-02**: Đăng nhập với mật khẩu sai -> Trả về lỗi `401 Unauthorized`.
- [ ] **TC-AUTH-LOG-03**: Đăng nhập với số điện thoại chưa đăng ký -> Trả về lỗi `401 Unauthorized`.

### 2.3. Làm mới Token (Refresh Token)
- [ ] **TC-AUTH-REF-01**: Truyền Refresh Token hợp lệ -> Trả về `200 OK` kèm cặp Token mới. Token cũ bị vô hiệu hóa.
- [ ] **TC-AUTH-REF-02**: Truyền Refresh Token đã hết hạn -> Trả về lỗi `401 Unauthorized`.
- [ ] **TC-AUTH-REF-03**: Tái sử dụng Refresh Token đã bị thu hồi (Token Theft Detection) -> Phát hiện và thu hồi toàn bộ các token thuộc cùng `familyId`, trả về lỗi `401 Unauthorized`.

### 2.4. Đăng xuất (Logout)
- [ ] **TC-AUTH-OUT-01**: Đăng xuất với Refresh Token hợp lệ -> Trả về `200 OK`, phiên bị thu hồi (`revokedAt`).
- [ ] **TC-AUTH-OUT-02**: Dùng lại Refresh Token đã đăng xuất để gọi `/auth/refresh` -> Trả về lỗi `401 Unauthorized`.
