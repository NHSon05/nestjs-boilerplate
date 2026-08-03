# Specification: Feature Authentication (Feature Spec)

Document này mô tả chi tiết yêu cầu kỹ thuật, cơ chế bảo mật Token (JWT & Refresh Session Family), quy trình mã hóa và đặc tả API cho tính năng **Đăng ký, Đăng nhập, Làm mới Token và Đăng xuất (Authentication)**.

---

## 1. Tổng quan Nghiệp vụ (Business Overview)

Hệ thống xác thực (Authentication) chịu trách nhiệm:

1. **Đăng ký tài khoản (`POST /auth/register`)**: Khởi tạo tài khoản người dùng mới với vai trò `TOURIST` hoặc `GUIDE`, mã hóa mật khẩu bằng `bcrypt`, tự động tạo `TouristProfile` hoặc `GuideProfile` mặc định, và trả về cặp Token (`accessToken` + `refreshToken`).
2. **Đăng nhập (`POST /auth/login`)**: Xác thực tài khoản qua số điện thoại/email và mật khẩu, cấp phiên làm việc mới và lưu vết trong bảng `refresh_sessions`.
3. **Làm mới Token (`POST /auth/refresh`)**: Cơ chế xoay phiên (Token Rotation) - cấp `accessToken` mới và `refreshToken` mới, đồng thời vô hiệu hóa `refreshToken` cũ.
4. **Đăng xuất (`POST /auth/logout`)**: Thu hồi phiên làm việc (`revokedAt = NOW()`) để vô hiệu hóa Refresh Token.

---

## 2. Đặc tả Bảo mật & Cấu trúc Token (Security Specifications)

### 2.1 Access Token (JWT)

- **Thuật toán**: RS256 hoặc HS256 với bí mật `JWT_SECRET`.
- **Thời gian hết hạn (TTL)**: 15 phút (ngắn hạn).
- **Payload**:

```json
{
  "sub": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
  "email": "user@example.com",
  "role": "TOURIST",
  "iat": 1785500000,
  "exp": 1785500900
}
```

### 2.2 Refresh Token & Refresh Session Family

- **Lưu trữ Database**: Bảng `refresh_sessions` (`userId`, `tokenHash`, `familyId`, `deviceName`, `ipAddress`, `expiresAt`, `revokedAt`).
- **Thời gian hết hạn**: 7 ngày hoặc 30 ngày.
- **Cơ chế Token Rotation**:
  - Mỗi khi client gọi `POST /auth/refresh`, server hủy token cũ và cấp token mới cùng `familyId`.
  - Nếu một Refresh Token đã bị hủy/thu hồi cố tình được sử dụng lại (dấu hiệu lộ Token), server lập tức thu hồi toàn bộ gia đình phiên (`familyId`) để bảo vệ tài khoản.

---

## 3. Danh sách API Specification

Tiền tố chung: `/api/v1`

### 3.1. Đăng ký Tài khoản (Register)

#### `POST /api/v1/auth/register`

- **Access Control**: Public (Không yêu cầu Token)
- **Header**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0987654321",
  "email": "nguyenvana@gmail.com",
  "password": "Password123@",
  "confirmPassword": "Password123@",
  "role": "TOURIST"
}
```

> _Lưu ý: `role` nhận các giá trị `"TOURIST"` hoặc `"GUIDE"`. Mặc định là `"TOURIST"`._

- **Response Success (201 Created)**:

```json
{
  "user": {
    "id": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
    "fullName": "Nguyễn Văn A",
    "phone": "0987654321",
    "email": "nguyenvana@gmail.com",
    "avatarUrl": null,
    "gender": null,
    "dateOfBirth": null,
    "role": "TOURIST",
    "status": "ACTIVE",
    "touristProfile": {
      "userId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
      "preferredLanguage": null,
      "nationality": null,
      "interests": [],
      "travelPreferences": null
    },
    "guideProfile": null,
    "createdAt": "2026-07-29T10:00:00.000Z",
    "updatedAt": "2026-07-29T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

- **Response Error (409 Conflict)**:

```json
{
  "statusCode": 409,
  "message": "Số điện thoại hoặc email đã được sử dụng",
  "error": "Conflict"
}
```

---

### 3.2. Đăng nhập (Login)

#### `POST /api/v1/auth/login`

- **Access Control**: Public (Không yêu cầu Token)
- **Request Body**:

```json
{
  "phone": "0987654321",
  "password": "Password123@"
}
```

- **Response Success (200 OK)**:

```json
{
  "user": {
    "id": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
    "fullName": "Nguyễn Văn A",
    "phone": "0987654321",
    "email": "nguyenvana@gmail.com",
    "role": "TOURIST",
    "status": "ACTIVE",
    "touristProfile": {
      "userId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
      "preferredLanguage": null,
      "nationality": null,
      "interests": [],
      "travelPreferences": null
    },
    "guideProfile": null
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

- **Response Error (401 Unauthorized)**:

```json
{
  "statusCode": 401,
  "message": "Số điện thoại hoặc mật khẩu không chính xác",
  "error": "Unauthorized"
}
```

---

### 3.3. Làm mới Token (Refresh Token)

#### `POST /api/v1/auth/refresh`

- **Access Control**: Public (Truyền Refresh Token trong Body)
- **Request Body**:

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

- **Response Success (200 OK)**:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

- **Response Error (401 Unauthorized)**:

```json
{
  "statusCode": 401,
  "message": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ",
  "error": "Unauthorized"
}
```

---

### 3.4. Đăng xuất (Logout)

#### `POST /api/v1/auth/logout`

- **Access Control**: Public (Truyền Refresh Token để thu hồi phiên)
- **Request Body**:

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

- **Response Success (200 OK)**:

```json
{
  "message": "Đăng xuất thành công"
}
```
