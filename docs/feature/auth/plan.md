# Implementation Plan: Feature Authentication (Feature Plan)

Document này định nghĩa kiến trúc tổng quan và lộ trình triển khai chi tiết từng bước cho tính năng **Xác thực Người dùng (Authentication)**.

---

## 1. Sơ đồ Kiến trúc Xác thực (Auth Architecture)

```
[ Client App ] ──► POST /auth/login ──► [ AuthController ]
                                                │
                                                ▼
                                         [ AuthService ]
                                         ├── Bcrypt Compare (Mật khẩu)
                                         ├── JwtService (Sign Access Token)
                                         └── RefreshSession (Save Token Hash)
                                                │
                                                ▼
                                     [ Database / PostgreSQL ]
                                     ├── Table: users
                                     └── Table: refresh_sessions
```

---

## 2. Kế hoạch triển khai từng bước (Phased Implementation Strategy)

### Giai đoạn 1: Model & Schema Database
- **Mục tiêu**: Xây dựng cấu trúc bảng `users` và `refresh_sessions`.
- **Thành phần**:
  - `User`: `id`, `email`, `phone`, `passwordHash`, `role`, `status`.
  - `RefreshSession`: `id`, `userId`, `tokenHash`, `familyId`, `expiresAt`, `revokedAt`.

### Giai đoạn 2: Module Auth & DTO Validation
- **Mục tiêu**: Định nghĩa các DTO đầu vào với `@nestjs/swagger` và `class-validator`.
- **Thành phần**: `RegisterDto`, `LoginDto`, `RefreshTokenDto`.

### Giai đoạn 3: Logic Đăng ký & Đăng nhập (Register & Login)
- **Mục tiêu**: Xử lý logic mã hóa bcrypt và cấp phát cặp JWT Token.
- **Thành phần**: `AuthService.register()`, `AuthService.login()`. Tự động khởi tạo `TouristProfile` hoặc `GuideProfile` dựa trên `role`.

### Giai đoạn 4: Quản lý Phiên & Token Rotation (Refresh & Logout)
- **Mục tiêu**: Quản lý phiên đăng nhập an toàn, xoay refresh token và thu hồi token khi đăng xuất.
- **Thành phần**: `AuthService.refresh()`, `AuthService.logout()`. Hủy gia đình phiên (`familyId`) nếu phát hiện token bị dùng lại.

### Giai đoạn 5: Integration với Passport & JwtStrategy
- **Mục tiêu**: Bảo vệ các API yêu cầu đăng nhập bằng `JwtAuthGuard`.
- **Thành phần**: `JwtStrategy` trích xuất Bearer Token từ Authorization Header.

---

## 3. Lưu ý Bảo mật (Security Considerations)

1. **Mã hóa mật khẩu**: Sử dụng `bcrypt` với 10 salt rounds.
2. **Không lưu Token thô xuống DB**: Lưu dạng băm `tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')`.
3. **Phòng chống tấn công brute-force**: Áp dụng Rate Limiting trên các endpoint `/auth/login` và `/auth/register`.
