# Giai đoạn 2: User Profile

## Mục tiêu

Cho phép người dùng

- Xem hồ sơ
- Cập nhật hồ sơ
- Upload avatar
- Đổi mật khẩu
- Xem thông tin công khai của người khác

## API

### 1. Get My Profile

`GET /users/me`

### 2. Update My Profile

`PATCH /users/me`

### 3. Upload Avatar

`POST /users/me/avatar`

### 4. Change Password

`POST /users/change-password`

### 5. Get public profile

`GET /users/:id`

Không trả

passwordHash
refreshSessions

### Chỉnh sửa hồ sơ

`PATCH /tourists/profile`

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

`PATCH /guides/profile`

### Toggle giữa tourist và guide

`PATCH /users/me/role`

### Upload avatar

`PATCH /users/me/avatar`
