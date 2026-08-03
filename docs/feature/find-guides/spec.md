# Specification: Feature Find Nearby Guides (Feature Spec)

Document này mô tả chi tiết yêu cầu kỹ thuật, luồng nghiệp vụ và định nghĩa API cho tính năng **Tìm kiếm Hướng dẫn viên địa phương gần đây (Find Nearby Guides)** dựa trên tọa độ địa lý và PostGIS.

---

## 1. Tổng quan nghiệp vụ (Business Overview)

Tính năng **Find Nearby Guides** hỗ trợ Khách du lịch (Tourist):
1. Tìm kiếm và hiển thị danh sách Hướng dẫn viên (Guide) đang bật chế độ sẵn sàng (`isAvailable = true`) nằm trong bán kính **5 km** (hoặc tùy chỉnh từ 0.5km đến 50km).
2. Hiển thị marker vị trí Guide trên bản đồ cùng thông tin khoảng cách (km), giá thuê theo giờ, điểm đánh giá trung bình và ngôn ngữ hỗ trợ.
3. Xem hồ sơ chi tiết (Public Profile) của Guide.
4. Gửi yêu cầu hướng dẫn (`GuideRequest`) trực tiếp tới Guide được chọn.

> **Quy tắc hệ thống**: Mobile Client không tự "quét" toàn bộ danh sách Guide. Mobile chỉ gửi tọa độ trung tâm (vĩ độ/kinh độ), Backend chịu trách nhiệm truy vấn không gian (Geospatial query) và tính toán khoảng cách.

---

## 2. Luồng nghiệp vụ chi tiết (Business Flows)

```
[ Tourist mở Bản đồ ]
        │
        ▼
[ Tìm địa điểm (Google Places API) ]
        │ Trả về Latitude, Longitude, PlaceId
        ▼
[ Gọi GET /api/v1/guides/nearby ] ──► [ Backend truy vấn PostGIS ST_DWithin (5km) ]
                                                        │
[ Hiển thị Markers Guide trên Map ] ◄────────────────────┘
        │
        ├─► [ Click Marker -> Xem Preview Card ]
        │
        ├─► [ Xem Profile: GET /api/v1/guides/:guideId ]
        │
        └─► [ Chọn Guide -> POST /api/v1/guide-requests ]
```

### 2.1. Tìm kiếm và hiển thị vị trí
1. Tourist mở bản đồ, hệ thống lấy vị trí hiện tại hoặc nhập tên địa điểm (VD: "Hoi An City").
2. Google Places API trả về tọa độ `latitude` (vĩ độ) và `longitude` (kinh độ).
3. Client gửi request `GET /api/v1/guides/nearby` kèm tọa độ và bán kính (`radiusKm=5`).
4. Backend kiểm tra điều kiện Guide hợp lệ:
   - Trạng thái hoạt động tài khoản: `status = ACTIVE`.
   - Trạng thái sẵn sàng: `isAvailable = true`.
   - Có dữ liệu hồ sơ `GuideProfile`.
   - Vị trí GPS hiện tại (`UserCurrentLocation`) nằm trong bán kính 5 km.
   - Vị trí GPS chưa quá hạn (`expires_at` chưa hết hạn hoặc `NULL`).
   - Không chứa chính tài khoản của User đang gửi request.
5. Client nhận danh sách và vẽ các Marker Guide trên bản đồ.

---

### 2.2. Cập nhật trạng thái và vị trí của Guide
1. **Bật/tắt sẵn sàng**: Guide gọi `PATCH /api/v1/guides/me/availability` với `isAvailable: true/false`.
2. **Cập nhật vị trí GPS định kỳ**: Ứng dụng di động của Guide định kỳ gửi tọa độ về `PUT /api/v1/users/me/location`.
3. Backend chuyển đổi tọa độ GPS sang điểm không gian **PostGIS Point (SRID 4326)** và lưu vào bảng `user_current_locations`.

---

### 2.3. Chọn Guide và Gửi Yêu Cầu (Guide Request)
1. Tourist nhấp vào Marker Guide trên bản đồ để xem Preview Card.
2. Card cung cấp 2 lựa chọn: **Xem Profile** (`GET /api/v1/guides/:guideId`) hoặc **Chọn Guide**.
3. Khi Tourist bấm "Chọn Guide", hệ thống không tạo cuộc hội thoại chat ngay lập tức mà tạo một **`GuideRequest`** (`POST /api/v1/guide-requests`).
4. Guide nhận thông báo yêu cầu và lựa chọn `ACCEPT` hoặc `REJECT`. Khi `ACCEPT`, hệ thống mới tự động tạo cuộc trò chuyện (`Conversation`).

---

## 3. Danh sách API Specification

Tiền tố chung: `/api/v1`

### 3.1. Tìm Guide gần đây (Find Nearby Guides)

#### `GET /api/v1/guides/nearby`
- **Mô tả**: Tìm danh sách Guide đang sẵn sàng trong bán kính cho trước xung quanh tọa độ trung tâm.
- **Header**: `Authorization: Bearer <token>`
- **Query Params**:
  - `latitude` (number, required): Vĩ độ điểm trung tâm (Ví dụ: `15.8801`)
  - `longitude` (number, required): Kinh độ điểm trung tâm (Ví dụ: `108.3380`)
  - `radiusKm` (number, optional, default: 5, min: 0.5, max: 50): Bán kính tìm kiếm (km)
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 20, max: 100)
  - `availableOnly` (boolean, optional, default: true)

- **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "guide-user-id-1",
      "fullName": "Tran Minh Khoa",
      "avatarUrl": "https://res.cloudinary.com/localism/avatars/guide1.jpg",
      "latitude": 15.8872,
      "longitude": 108.3421,
      "distanceKm": 0.94,
      "hourlyRate": "250000",
      "averageRating": "4.8",
      "totalReviews": 31,
      "isAvailable": true,
      "languages": [
        {
          "code": "en",
          "name": "English",
          "proficiencyLevel": "ADVANCED"
        },
        {
          "code": "vi",
          "name": "Vietnamese",
          "proficiencyLevel": "NATIVE"
        }
      ]
    }
  ],
  "search": {
    "latitude": 15.8801,
    "longitude": 108.338,
    "radiusKm": 5
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### 3.2. Xem hồ sơ công khai của Guide

#### `GET /api/v1/guides/:guideId`
- **Mô tả**: Lấy thông tin chi tiết hồ sơ cá nhân của Guide.
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "id": "guide-user-id-1",
  "fullName": "Tran Minh Khoa",
  "avatarUrl": "https://res.cloudinary.com/...",
  "guideProfile": {
    "bio": "Hướng dẫn viên địa phương nhiệt tình tại Hội An và Đà Nẵng",
    "yearsExperience": 4,
    "hourlyRate": "250000",
    "currency": "VND",
    "city": "Hội An",
    "country": "Việt Nam",
    "averageRating": "4.8",
    "reviewCount": 31,
    "isAvailable": true,
    "languages": [
      {
        "languageId": "lang-uuid-1",
        "proficiencyLevel": "ADVANCED",
        "language": {
          "code": "en",
          "name": "English"
        }
      }
    ]
  }
}
```

---

### 3.3. Cập nhật trạng thái sẵn sàng (Availability)

#### `PATCH /api/v1/guides/me/availability`
- **Mô tả**: Guide bật hoặc tắt trạng thái sẵn sàng nhận tour.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "isAvailable": true
}
```
- **Response (200 OK)**: Trả về thông tin `GuideProfile` đã cập nhật.

---

### 3.4. Cập nhật vị trí GPS hiện tại (Current Location)

#### `PUT /api/v1/users/me/location`
- **Mô tả**: Cập nhật tọa độ GPS thực tế từ thiết bị di động.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "latitude": 15.8872,
  "longitude": 108.3421,
  "accuracy": 12.4
}
```
- **Response (200 OK)**:
```json
{
  "message": "Cập nhật vị trí hiện tại thành công"
}
```

---

### 3.5. Tạo Yêu cầu Hướng dẫn (Guide Request)

#### `POST /api/v1/guide-requests`
- **Mô tả**: Gửi yêu cầu hướng dẫn tới Guide đã chọn.
- **Header**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "guideId": "guide-user-id-1",
  "title": "Chuyến tham quan Phố cổ Hội An 1 ngày",
  "description": "Tôi muốn tham quan phố cổ và trải nghiệm ẩm thực địa phương.",
  "startAt": "2026-08-10T08:00:00.000Z",
  "endAt": "2026-08-10T17:00:00.000Z",
  "meetingAddress": "123 Trần Phú, Minh An, Hội An, Quảng Nam",
  "meetingLatitude": 15.8801,
  "meetingLongitude": 108.338,
  "proposedPrice": 1500000,
  "currency": "VND"
}
```

---

## 4. Đặc tả truy vấn không gian PostGIS (Geospatial Specifications)

Bảng dữ liệu: `user_current_locations`
- Kiểu dữ liệu không gian: `location GEOGRAPHY(Point, 4326)`
- Chỉ mục không gian: GiST Index trên cột `location`

Lệnh SQL truy vấn PostGIS tối ưu:
```sql
SELECT 
  u."id" AS "user_id",
  u."full_name",
  u."avatar_url",
  gp."hourly_rate",
  gp."average_rating",
  gp."review_count",
  gp."is_available",
  loc."latitude",
  loc."longitude",
  ST_Distance(
    loc."location",
    ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326)::geography
  ) / 1000.0 AS "distance_km"
FROM "user_current_locations" loc
JOIN "users" u ON u."id" = loc."user_id"
JOIN "guide_profiles" gp ON gp."user_id" = u."id"
WHERE u."status" = 'ACTIVE'
  AND gp."is_available" = true
  AND (loc."expires_at" IS NULL OR loc."expires_at" > NOW())
  AND ST_DWithin(
    loc."location",
    ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326)::geography,
    $radius_meters
  )
ORDER BY "distance_km" ASC
LIMIT $limit OFFSET $offset;
```
