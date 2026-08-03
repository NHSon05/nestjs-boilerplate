# Specification: Feature Tourist & Guide Profile (Feature Spec)

Document này mô tả chi tiết yêu cầu kỹ thuật, luồng nghiệp vụ và định nghĩa API cho tính năng **Quản lý Hồ sơ Chuyên biệt cho Tourist và Guide (bao gồm Quản lý Ngôn ngữ Hướng dẫn viên)**.

---

## 1. Tổng quan nghiệp vụ (Business Overview)

Hệ thống phân tách hồ sơ cá nhân theo từng vai trò chuyên biệt:
1. **Tourist Profile (`/tourists/profile`)**: Dành riêng cho tài khoản khách du lịch (`Role: TOURIST`), quản lý quốc tịch, ngôn ngữ ưu tiên, danh sách sở thích (`interests`) và tùy chọn hành trình du lịch (`travelPreferences`).
2. **Guide Profile (`/guides/profile`)**: Dành riêng cho tài khoản hướng dẫn viên (`Role: GUIDE`), quản lý tiểu sử (`bio`), số năm kinh nghiệm, giá thuê theo giờ (`hourlyRate`), thành phố/quốc gia hoạt động, đơn vị tiền tệ và trạng thái xác minh.
3. **Guide Language Management (`/guides/me/languages`)**: Cho phép Guide đăng ký và quản lý các ngôn ngữ có thể sử dụng kèm trình độ thông thạo (`BASIC`, `INTERMEDIATE`, `ADVANCED`, `NATIVE`).

---

## 2. Quy tắc Phân quyền (Access Control Rules)

- **Tourist Profile APIs**: Chỉ cho phép tài khoản có `role = TOURIST`. Ngược lại trả về `403 Forbidden` với thông báo `"Chỉ có tài khoản TOURIST mới được chỉnh sửa hồ sơ du khách"`.
- **Guide Profile & Language APIs**: Chỉ cho phép tài khoản có `role = GUIDE`. Ngược lại trả về `403 Forbidden` với thông báo `"Chỉ có GUIDE mới chỉnh sửa được hồ sơ người hướng dẫn"`.

---

## 3. Danh sách API Specification

Tiền tố chung: `/api/v1`

### 3.1. Tourist Profile Module

#### `PATCH /api/v1/tourists/profile`
- **Mô tả**: Cập nhật thông tin hồ sơ khách du lịch.
- **Header**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "nationality": "VN",
  "preferredLanguage": "vi",
  "interests": ["Food", "Photography", "Camping"],
  "travelPreferences": {
    "budget": "medium",
    "pace": "relaxed"
  }
}
```
> *Tất cả các trường đều là tùy chọn (`@IsOptional()`).*

- **Response Success (200 OK)**:
```json
{
  "userId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
  "nationality": "VN",
  "preferredLanguage": "vi",
  "interests": ["Food", "Photography", "Camping"],
  "travelPreferences": {
    "budget": "medium",
    "pace": "relaxed"
  }
}
```
- **Response Error (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "message": "Chỉ có tài khoản TOURIST mới được chỉnh sửa hồ sơ du khách",
  "error": "Forbidden"
}
```

---

### 3.2. Guide Profile Module

#### `PATCH /api/v1/guides/profile`
- **Mô tả**: Cập nhật thông tin hồ sơ Hướng dẫn viên.
- **Header**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "bio": "Hướng dẫn viên du lịch chuyên nghiệp với hơn 3 năm kinh nghiệm tại Đà Nẵng và Hội An",
  "yearsExperience": 3,
  "hourlyRate": 300000,
  "city": "Đà Nẵng",
  "country": "Việt Nam",
  "currency": "VND"
}
```
> *Tất cả các trường đều là tùy chọn (`@IsOptional()`).*

- **Response Success (200 OK)**:
```json
{
  "userId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
  "bio": "Hướng dẫn viên du lịch chuyên nghiệp với hơn 3 năm kinh nghiệm tại Đà Nẵng và Hội An",
  "yearsExperience": 3,
  "hourlyRate": 300000,
  "city": "Đà Nẵng",
  "country": "Việt Nam",
  "currency": "VND",
  "isAvailable": false,
  "verificationStatus": "UNVERIFIED",
  "averageRating": "0",
  "reviewCount": 0,
  "languages": []
}
```

---

### 3.3. Guide Language Management

#### `GET /api/v1/guides/me/languages`
- **Mô tả**: Lấy danh sách các ngôn ngữ Guide đã đăng ký kèm trình độ.
- **Header**: `Authorization: Bearer <access_token>`
- **Response Success (200 OK)**:
```json
[
  {
    "guideId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
    "languageId": "e5b8a012-3456-7890-abcd-ef1234567890",
    "proficiencyLevel": "NATIVE",
    "language": {
      "id": "e5b8a012-3456-7890-abcd-ef1234567890",
      "code": "vi",
      "name": "Tiếng Việt"
    }
  },
  {
    "guideId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
    "languageId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "proficiencyLevel": "ADVANCED",
    "language": {
      "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "code": "en",
      "name": "English"
    }
  }
]
```

#### `POST /api/v1/guides/me/languages`
- **Mô tả**: Thêm mới hoặc cập nhật trình độ ngôn ngữ trong hồ sơ Guide (Upsert).
- **Header**: `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "languageId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "proficiencyLevel": "ADVANCED"
}
```
> *`proficiencyLevel` nhận các giá trị Enum: `"BASIC"`, `"INTERMEDIATE"`, `"ADVANCED"`, `"NATIVE"`.*

- **Response Success (201 Created / 200 OK)**:
```json
{
  "guideId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
  "languageId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "proficiencyLevel": "ADVANCED",
  "language": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "code": "en",
    "name": "English"
  }
}
```

#### `DELETE /api/v1/guides/me/languages/:languageId`
- **Mô tả**: Xóa một ngôn ngữ khỏi hồ sơ của Guide.
- **Header**: `Authorization: Bearer <access_token>`
- **Path Parameter**: `languageId` (UUID)
- **Response Success (200 OK)**:
```json
{
  "message": "Đã xóa ngôn ngữ khỏi hồ sơ thành công"
}
```
- **Response Error (404 Not Found)**:
```json
{
  "statusCode": 404,
  "message": "Ngôn ngữ chưa có trong danh sách hồ sơ của bạn",
  "error": "Not Found"
}
```
