# Tourist API Documentation

Tài liệu đặc tả chi tiết các API dành cho Du khách thuộc Module **Tourists**.

---

## 1. Tourists Module (`/tourists`)

### 1.1 Cập nhật hồ sơ Du khách (`PATCH /tourists/profile`)

- **HTTP Method:** `PATCH`
- **Endpoint:** `/api/v1/tourists/profile`
- **Access Control:** Authenticated Tourist (`Role: TOURIST`)

#### Request Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body

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

> _Tất cả các trường đều là tùy chọn (`@IsOptional()`)._

#### Response Success (200 OK)

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

#### Response Error (403 Forbidden)

```json
{
  "statusCode": 403,
  "message": "Chỉ có tài khoản TOURIST mới được chỉnh sửa hồ sơ du khách",
  "error": "Forbidden"
}
```
