# Guide API Documentation

Tài liệu đặc tả chi tiết các API dành cho Hướng dẫn viên và Quản lý Ngôn ngữ thuộc Module **Guides**.

---

## 1. Guides Profile Module (`/guides`)

### 1.1 Cập nhật hồ sơ Hướng dẫn viên (`PATCH /guides/profile`)

- **HTTP Method:** `PATCH`
- **Endpoint:** `/api/v1/guides/profile`
- **Access Control:** Authenticated Guide (`Role: GUIDE`)

#### Request Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body

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

> _Tất cả các trường đều là tùy chọn (`@IsOptional()`)._

#### Response Success (200 OK)

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

#### Response Error (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "Chỉ có GUIDE mới chỉnh sửa được hồ sơ người hướng dẫn",
  "error": "Forbidden"
}
```

---

## 2. Guide Language Management (`/guides/me/languages`)

### 2.1 Lấy danh sách ngôn ngữ của Hướng dẫn viên (`GET /guides/me/languages`)

- **HTTP Method:** `GET`
- **Endpoint:** `/api/v1/guides/me/languages`
- **Access Control:** Authenticated Guide (`Role: GUIDE`)

#### Request Headers

```http
Authorization: Bearer <access_token>
```

#### Response Success (200 OK)

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

---

### 2.2 Thêm / Cập nhật trình độ ngôn ngữ vào hồ sơ (`POST /guides/me/languages`)

- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/guides/me/languages`
- **Access Control:** Authenticated Guide (`Role: GUIDE`)

#### Request Body

```json
{
  "languageId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "proficiencyLevel": "ADVANCED"
}
```

> _`proficiencyLevel` nhận các giá trị: `"BASIC"`, `"INTERMEDIATE"`, `"ADVANCED"`, `"NATIVE"`._

#### Response Success (201 Created / 200 OK)

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

---

### 2.3 Xóa một ngôn ngữ khỏi hồ sơ (`DELETE /guides/me/languages/:languageId`)

- **HTTP Method:** `DELETE`
- **Endpoint:** `/api/v1/guides/me/languages/:languageId`
- **Access Control:** Authenticated Guide (`Role: GUIDE`)

#### Path Parameters

- `languageId` (`string`, UUID): ID của ngôn ngữ cần xóa.

#### Response Success (200 OK)

```json
{
  "message": "Đã xóa ngôn ngữ khỏi hồ sơ thành công"
}
```

#### Response Error (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Ngôn ngữ chưa có trong danh sách hồ sơ của bạn",
  "error": "Not Found"
}
```
