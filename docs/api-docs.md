# API Documentation - Authentication Service

Tài liệu đặc tả các phương thức xử lý (methods) thuộc lớp `AuthService` hỗ trợ quy trình Đăng ký và Đăng nhập người dùng.

---

## 1. Đăng Ký Tài Khoản (`register`)

Hàm tiếp nhận thông tin từ form đăng ký của client, thực hiện validate, mã hóa mật khẩu, lưu thông tin người dùng mới xuống database và sinh cặp token phiên làm việc đầu tiên.

### Đầu Vào (Input)

Nhận vào đối tượng `RegisterDto` gồm các trường sau:

- **`email`** (`string`): Địa chỉ email đăng ký (sẽ tự động đưa về dạng viết thường).
- **`fullName`** (`string`): Họ và tên hiển thị.
- **`password`** (`string`): Mật khẩu thô (yêu cầu từ 8 - 72 ký tự).
- **`confirmPassword`** (`string`): Nhập lại mật khẩu để so khớp.
- **`role`** (`UserRole`, tùy chọn): Vai trò mặc định của người dùng (`TOURIST`, `GUIDE`, `ADMIN`).

### Đầu Ra (Output)

Trả về một `Promise` chứa thông tin tài khoản người dùng đã được ẩn mật khẩu (`sanitize`) và cặp token xác thực:

```json
{
  "user": {
    "id": "uuid-string",
    "email": "test@gmail.com",
    "fullName": "Nguyen Son",
    "phone": null,
    "avatarUrl": null,
    "role": "TOURIST",
    "status": "ACTIVE",
    "emailVerificationAt": null,
    "lastLoginAt": null,
    "createdAt": "2026-07-27T10:00:00.000Z",
    "updatedAt": "2026-07-27T10:00:00.000Z",
    "deletedAt": null
  },
  "accessToken": "eyJhbGciOi...", // Access Token dùng để truy cập các API bảo mật (hết hạn sau 15 phút)
  "refreshToken": "eyJhbGciOi..." // Refresh Token dùng để cấp lại Access Token mới (hết hạn sau 30 ngày)
}
```

---

## 2. Đăng Nhập Hệ Thống (`login`)

Hàm xác thực thông tin đăng nhập từ client, đối chiếu mật khẩu đã mã hóa trong database, và cấp phiên đăng nhập mới.

### Đầu Vào (Input)

Nhận vào đối tượng `LoginDto` gồm các trường sau:

- **`email`** (`string`): Địa chỉ email đăng nhập.
- **`password`** (`string`): Mật khẩu thô.

### Đầu Ra (Output)

Trả về một `Promise` chứa thông tin tài khoản người dùng và cặp token (Cấu trúc tương tự như hàm `register`):

```json
{
  "user": {
    "id": "uuid-string",
    "email": "test@gmail.com",
    "fullName": "Nguyen Son",
    "role": "TOURIST",
    "status": "ACTIVE"
    // ... các trường thông tin cơ bản khác (đã lọc bỏ mật khẩu) ...
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```
