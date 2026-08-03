# Specification: Feature User Profile (Feature Spec)

Document này mô tả chi tiết yêu cầu kỹ thuật, luồng nghiệp vụ và định nghĩa API cho tính năng **Quản lý Hồ sơ Người dùng (User Profile)** bao gồm thông tin cá nhân, hồ sơ Tourist/Guide, đổi mật khẩu, upload avatar và xem profile công khai.

---

## 1. Tổng quan nghiệp vụ (Business Overview)

Hệ thống quản lý thông tin người dùng hỗ trợ:

1. **Thông tin cơ bản (Core Profile)**: Xem và cập nhật họ tên, giới tính, ngày sinh.
2. **Hồ sơ chuyên biệt theo vai trò**:
   - **Tourist Profile**: Quốc tịch, ngôn ngữ ưu tiên, danh sách sở thích (`interests`), tùy chọn du lịch (`travelPreferences`).
   - **Guide Profile**: Tiểu sử (`bio`), số năm kinh nghiệm, giá thuê theo giờ, thành phố/quốc gia hoạt động, trạng thái sẵn sàng.
3. **Quản lý Ảnh đại diện (Avatar Upload)**: Upload và cập nhật avatar lên Cloudinary, tự động xóa ảnh cũ.
4. **Đổi mật khẩu (Change Password)**: Xác thực mật khẩu cũ và đổi sang mật khẩu mới an toàn.
5. **Chuyển đổi vai trò (Role Switch)**: Chuyển đổi giữa hai vai trò `TOURIST` và `GUIDE`.
6. **Hồ sơ công khai (Public Profile)**: Cho phép người dùng khác xem profile công khai nhưng bảo mật tuyệt đối các thông tin nhạy cảm.

---

## 2. Luồng nghiệp vụ chi tiết (Business Flows)

```
[ Người dùng đăng nhập ]
        │
        ├─► Xem hồ sơ bản thân: GET /api/v1/users/me
        │
        ├─► Cập nhật thông tin chung: PATCH /api/v1/users/me
        │
        ├─► Cập nhật hồ sơ Tourist: PATCH /api/v1/tourists/profile
        │
        ├─► Cập nhật hồ sơ Guide: PATCH /api/v1/guides/profile
        │
        ├─► Upload Avatar: POST /api/v1/users/me/avatar ──► [ Cloudinary Storage ]
        │
        ├─► Chuyển vai trò: PATCH /api/v1/users/me/role
        │
        └─► Đổi mật khẩu: POST /api/v1/users/change-password
```

---

## 3. Danh sách API Specification

Tiền tố chung: `/api/v1`

### 3.1. Xem Hồ sơ Bản thân (Get My Profile)

#### `GET /api/v1/users/me`

- **Mô tả**: Trả về đầy đủ thông tin cá nhân của người dùng đang đăng nhập (kèm TouristProfile và GuideProfile nếu có).
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**:

```json
{
  "id": "u1b2c3d4-5678-90ab-cdef-1234567890ab",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "gender": "MALE",
  "dateOfBirth": "1998-05-20",
  "phone": "+84912345678",
  "avatarUrl": "https://res.cloudinary.com/localism/avatars/user1.jpg",
  "role": "TOURIST",
  "status": "ACTIVE",
  "touristProfile": {
    "nationality": "VN",
    "preferredLanguage": "vi",
    "interests": ["Food", "Photography", "Hiking"],
    "travelPreferences": {
      "budget": "medium",
      "pace": "relaxed"
    }
  },
  "guideProfile": null,
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

---

### 3.2. Cập nhật Thông tin Chung (Update Core Profile)

#### `PATCH /api/v1/users/me`

- **Mô tả**: Cập nhật thông tin cá nhân cơ bản.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "fullName": "Nguyen Van A Updated",
  "gender": "MALE",
  "dateOfBirth": "1998-05-20"
}
```

---

### 3.3. Cập nhật Hồ sơ Khách du lịch (Update Tourist Profile)

#### `PATCH /api/v1/tourists/profile`

- **Mô tả**: Cập nhật thông tin chi tiết dành cho Tourist.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "nationality": "VN",
  "preferredLanguage": "vi",
  "interests": ["Food", "Photography", "Hiking"],
  "travelPreferences": {
    "budget": "medium",
    "pace": "relaxed"
  }
}
```

---

### 3.4. Cập nhật Hồ sơ Hướng dẫn viên (Update Guide Profile)

#### `PATCH /api/v1/guides/profile`

- **Mô tả**: Cập nhật thông tin chi tiết dành cho Guide.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "bio": "Local guide am hiểu văn hóa ẩm thực Hội An",
  "yearsExperience": 3,
  "hourlyRate": 250000,
  "city": "Hội An",
  "country": "Việt Nam",
  "currency": "VND"
}
```

---

### 3.5. Upload Ảnh Đại Diện (Upload Avatar)

#### `POST /api/v1/users/me/avatar`

- **Mô tả**: Upload file ảnh đại diện mới lên Cloudinary và cập nhật `avatarUrl` trong database. Nếu user đã có avatar trước đó, tự động xóa file cũ trên Cloudinary qua `avatarPublicId`.
- **Content-Type**: `multipart/form-data`
- **Form Data Field**: `file` (Image file: jpg, png, webp, max 5MB)
- **Response (200 OK)**:

```json
{
  "message": "Upload ảnh đại diện thành công",
  "avatarUrl": "https://res.cloudinary.com/localism/avatars/abc.jpg"
}
```

---

### 3.6. Đổi Mật Khẩu (Change Password)

#### `POST /api/v1/users/change-password`

- **Mô tả**: Thay đổi mật khẩu người dùng.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

- **Response (200 OK)**:

```json
{
  "message": "Đổi mật khẩu thành công"
}
```

---

### 3.7. Chuyển đổi Vai trò (Switch Role)

#### `PATCH /api/v1/users/me/role`

- **Mô tả**: Chuyển đổi vai trò sử dụng ứng dụng giữa `TOURIST` và `GUIDE`.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:

```json
{
  "role": "GUIDE"
}
```

---

### 3.8. Xem Hồ sơ Công khai (Get Public Profile)

#### `GET /api/v1/users/:id`

- **Mô tả**: Xem thông tin công khai của người dùng khác.
- **Bảo mật tuyệt đối**: Tuyệt đối **KHÔNG TRẢ VỀ** các trường nhạy cảm: `passwordHash`, `refreshSessions`, `phone`, `emailVerificationAt`, `deletedAt`.
- **Response (200 OK)**:

```json
{
  "id": "u1b2c3d4-5678-90ab-cdef-1234567890ab",
  "fullName": "Tran Minh Khoa",
  "avatarUrl": "https://res.cloudinary.com/...",
  "role": "GUIDE",
  "guideProfile": {
    "bio": "Local guide in Hoi An",
    "yearsExperience": 4,
    "hourlyRate": "250000",
    "averageRating": "4.8",
    "reviewCount": 31
  }
}
```
