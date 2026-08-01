# Guide Request

Nội dung trong file này mô tả về flow và cung cấp endpoint feature 2

Tourist chọn một địa điểm trên Google Maps
→ App lấy latitude/longitude của địa điểm đó
→ Gọi backend tìm Guide đang hoạt động trong bán kính 5 km
→ Backend trả danh sách Guide kèm khoảng cách
→ App hiển thị marker Guide trên bản đồ
→ Tourist có thể xem profile hoặc chọn Guide để gửi request

> > Không nên để mobile tự “quét” tất cả Guide. Mobile chỉ gửi tọa độ trung tâm, backend thực hiện truy vấn khoảng cách.

## 1. Flow tổng thể

### Bước 1: Hiển thị bản đồ

```json
{
  "latitude": 15.8801,
  "longitude": 108.338
}
```

Vị trí này chỉ dùng để:

đặt camera bản đồ;
hiển thị chấm xanh;
có thể làm điểm tìm kiếm mặc định.

### Bước 2: Tourist tìm địa điểm

Tourist nhập: Hoi An City

> > Google Places API trả về thông tin địa điểm:

```json
{
  "placeId": "ChIJ...",
  "name": "Hoi An City",
  "formattedAddress": "Quang Nam, Viet Nam",
  "latitude": 15.8801,
  "longitude": 108.338
}
```

### Bước 3: Click Find Local Guide

Frontend gọi:
`GET /api/guides/nearby`

Query:

- latitude=15.8801
- longitude=108.3380
- radiusKm=5
- page=1
- limit=20

Ví dụ:
`GET /api/guides/nearby?latitude=15.8801&longitude=108.3380&radiusKm=5&page=1&limit=20`
`Authorization: Bearer ACCESS_TOKEN`

Backend tìm Guide thỏa mãn:
isAvailable = true
status = ACTIVE
guideProfile tồn tại
vị trí Guide nằm trong bán kính 5 km
vị trí Guide chưa quá cũ
không phải chính user hiện tại

### Bước 4: Hiển thị Guide trên map

```json
{
  "data": [
    {
      "id": "guide-user-id-1",
      "fullName": "Tran Minh Khoa",
      "avatarUrl": "https://res.cloudinary.com/...",
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

## 2. Database cần có gì?

Bạn đã có `UserCurrentLocation`, nên có thể dùng model này:
GuideProfile:

## 3. Guide cập nhật vị trí như thế nào?

Khi Guide bật chế độ sẵn sàng:
`PATCH /api/guides/me/availability`

```json
{
  "isAvailable": true
}
```

Sau đó mobile Guide định kỳ gửi vị trí:
`PUT /api/users/me/location`

```json
{
  "latitude": 15.8872,
  "longitude": 108.3421,
  "accuracy": 12.4
}
```

## 4. API tìm Guide gần địa điểm

`GET /guides/nearby`

## 5. Tính bán kính 5 km

### Phương án tốt hơn: PostgreSQL PostGIS

Khi hệ thống có nhiều Guide, nên dùng:

```
PostGIS
geography(Point, 4326)
ST_DWithin
ST_Distance
```

## 6. Click marker Guide

Khi Tourist click vào marker:
`Marker Guide → hiển thị preview card`

Preview response đã có thể chứa:

```json
{
  "id": "guide-id",
  "fullName": "Tran Minh Khoa",
  "avatarUrl": "https://...",
  "distanceKm": 0.94,
  "hourlyRate": "250000",
  "averageRating": "4.8",
  "languages": ["Vietnamese", "English"]
}
```

Card có hai nút:
View Profile
Select Guide

### Xem profile

`GET /api/guides/:guideId`

### Response

```json
{
  "id": "guide-id",
  "fullName": "Tran Minh Khoa",
  "avatarUrl": "https://...",
  "guideProfile": {
    "bio": "Local guide in Hoi An",
    "yearsExperience": 4,
    "hourlyRate": "250000",
    "averageRating": "4.8",
    "totalReviews": 31,
    "languages": []
  }
}
```

### Chọn Guide ngay

“Chọn Guide” không nên ngay lập tức ghép hai người hoặc mở chat.
Nó nên tạo một **GuideRequest**.
`POST /api/guide-requests`

Body:

```json
{
  "guideId": "guide-user-id",
  "destination": {
    "placeId": "ChIJ...",
    "name": "Hoi An City",
    "address": "Quang Nam, Viet Nam",
    "latitude": 15.8801,
    "longitude": 108.338
  },
  "scheduledAt": "2026-08-02T08:00:00.000Z",
  "durationHours": 3,
  "message": "Tôi muốn tham quan phố cổ và trải nghiệm ẩm thực."
}
```

Response:

```json
{
  "message": "Guide request created successfully",
  "data": {
    "id": "request-id",
    "status": "PENDING",
    "touristId": "tourist-user-id",
    "guideId": "guide-user-id",
    "destinationName": "Hoi An City",
    "scheduledAt": "2026-08-02T08:00:00.000Z"
  }
}
```

**Sau đó:**
Guide nhận request
→ ACCEPT hoặc REJECT
→ nếu ACCEPT thì tạo Conversation
→ hai bên chat

## 8. Các API cần xây dựng cho flow này

`PUT /users/me/location`
`PATCH /guides/me/availability`

`GET /guides/nearby`
`GET /guides/:guideId`
