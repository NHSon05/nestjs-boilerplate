# API Specification Documentation

Tài liệu quy định chi tiết các API Endpoints cho hệ thống, bao gồm các Module: **Authentication**, **Users**, **Tourists**, **Guides**, và **Languages**.

---

## 1. Authentication Module (`/auth`)

### 1.1 Đăng ký tài khoản (`POST /auth/register`)

- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/auth/register`
- **Access Control:** Public (Không yêu cầu Token)

#### Request Headers

```http
Content-Type: application/json
```

#### Request Body

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

> _Lưu ý:_ `role` nhận các giá trị: `"TOURIST"`, `"GUIDE"`. Mặc định là `"TOURIST"`.

#### Response Success (201 Created)

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

---

### 1.2 Đăng nhập (`POST /auth/login`)

- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/auth/login`
- **Access Control:** Public (Không yêu cầu Token)

#### Request Body

```json
{
  "phone": "0987654321",
  "password": "Password123@"
}
```

#### Response Success (200 OK)

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

#### Response Error (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Số điện thoại hoặc mật khẩu không chính xác",
  "error": "Unauthorized"
}
```

---

### 1.3 Làm mới Token (`POST /auth/refresh`)

- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/auth/refresh`
- **Access Control:** Public (Truyền Refresh Token trong Body)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

#### Response Success (200 OK)

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

#### Response Error (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Phiên đăng nhập đã hết hạn",
  "error": "Unauthorized"
}
```

---

### 1.4 Đăng xuất (`POST /auth/logout`)

- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/auth/logout`
- **Access Control:** Public (Truyền Refresh Token để thu hồi phiên)

#### Request Body

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

#### Response Success (200 OK)

```json
{
  "message": "Đăng xuất thành công"
}
```

---

## 2. Users Module (`/users`)

### 2.1 Lấy thông tin cá nhân hiện tại (`GET /users/me`)

- **HTTP Method:** `GET`
- **Endpoint:** `/api/v1/users/me`
- **Access Control:** Authenticated User (`JwtAuthGuard`)

#### Request Headers

```http
Authorization: Bearer <access_token>
```

#### Response Success (200 OK)

```json
{
  "id": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
  "email": "nguyenvana@gmail.com",
  "fullName": "Nguyễn Văn A",
  "gender": "MALE",
  "dateOfBirth": "1998-05-20T00:00:00.000Z",
  "phone": "0987654321",
  "avatarUrl": "https://example.com/avatar.jpg",
  "role": "GUIDE",
  "status": "ACTIVE",
  "touristProfile": null,
  "guideProfile": {
    "userId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
    "bio": "Hướng dẫn viên nhiệt tình tại Đà Nẵng",
    "yearsExperience": 3,
    "hourlyRate": 250000,
    "city": "Đà Nẵng",
    "country": "Việt Nam",
    "currency": "VND",
    "isAvailable": true,
    "verificationStatus": "UNVERIFIED",
    "averageRating": "5.0",
    "reviewCount": 12,
    "languages": [
      {
        "guideId": "c1f7b8a0-7612-4e4b-912a-8d76b1f23456",
        "languageId": "e5b8a012-3456-7890-abcd-ef1234567890",
        "proficiencyLevel": "NATIVE",
        "language": {
          "id": "e5b8a012-3456-7890-abcd-ef1234567890",
          "code": "vi",
          "name": "Tiếng Việt"
        }
      }
    ]
  }
}
```

---

### 2.2 Cập nhật thông tin cá nhân cơ bản (`PATCH /users/me`)

- **HTTP Method:** `PATCH`
- **Endpoint:** `/api/v1/users/me`
- **Access Control:** Authenticated User (`JwtAuthGuard`)

#### Request Body

```json
{
  "fullName": "Nguyễn Văn B",
  "gender": "MALE",
  "dateOfBirth": "1999-12-25"
}
```

> _Tất cả các trường đều là tùy chọn (`@IsOptional()`)._

#### Response Success (200 OK)

Trả về thông tin User đã được cập nhật kèm theo các profile tương ứng.

---

## 3. Tourists Module (`/tourists`)

### 3.1 Cập nhật hồ sơ Du khách (`PATCH /tourists/profile`)

- **HTTP Method:** `PATCH`
- **Endpoint:** `/api/v1/tourists/profile`
- **Access Control:** Authenticated Tourist (`Role: TOURIST`)

#### Request Headers

```http
Authorization: Bearer <access_token>
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

---

## 4. Guides Module & Language Management (`/guides`)

### 4.1 Cập nhật hồ sơ Hướng dẫn viên (`PATCH /guides/profile`)

- **HTTP Method:** `PATCH`
- **Endpoint:** `/api/v1/guides/profile`
- **Access Control:** Authenticated Guide (`Role: GUIDE`)

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

#### Response Success (200 OK)

Trả về thông tin `GuideProfile` vừa cập nhật.

---

### 4.2 Lấy danh sách ngôn ngữ của Hướng dẫn viên (`GET /guides/me/languages`)

- **HTTP Method:** `GET`
- **Endpoint:** `/api/v1/guides/me/languages`
- **Access Control:** Authenticated Guide (`Role: GUIDE`)

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

### 4.3 Thêm / Cập nhật trình độ ngôn ngữ vào hồ sơ (`POST /guides/me/languages`)

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

### 4.4 Xóa một ngôn ngữ khỏi hồ sơ (`DELETE /guides/me/languages/:languageId`)

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
