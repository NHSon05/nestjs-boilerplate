# Implementation Plan: Feature Find Nearby Guides (Feature Plan)

Document này định nghĩa kiến trúc tổng quan và lộ trình triển khai chi tiết từng bước cho tính năng **Tìm kiếm Hướng dẫn viên địa phương gần đây**.

---

## 1. Sơ đồ kiến trúc không gian (Geospatial Architecture)

```
[ Mobile Client (Tourist) ] ────► [ Google Places API ] (Lấy Tọa độ Địa điểm)
            │
            ▼ (GET /guides/nearby?latitude=...&longitude=...&radiusKm=5)
[ NestJS GuidesController ]
            │
            ▼
[ GeospatialService / LocationsService ]
            │
            ▼ (Raw SQL PostGIS Query)
[ PostgreSQL Database + PostGIS Extension ]
  ├── Table: user_current_locations (Geography Point SRID 4326 + GiST Index)
  ├── Table: guide_profiles (is_available, average_rating)
  └── Table: users (status = ACTIVE)
```

---

## 2. Kế hoạch triển khai từng bước (Phased Implementation Strategy)

---

### Giai đoạn 1: Cơ sở dữ liệu PostGIS & Schema Verification
- **Mục tiêu**: Kích hoạt tiện ích mở rộng PostGIS trên PostgreSQL và đảm bảo cấu trúc bảng lưu vị trí chuẩn xác.
- **Thành phần**:
  - Đảm bảo extension `postgis` đã được bật (`CREATE EXTENSION IF NOT EXISTS postgis`).
  - Bảng `user_current_locations`: Các cột `user_id` (PK, UUID), `latitude`, `longitude`, `location` (geography Point 4326), `accuracy_meters`, `updated_at`, `expires_at`.
  - Thiết lập GiST Index trên cột `location` giúp truy vấn `ST_DWithin` đạt tốc độ < 10ms.

---

### Giai đoạn 2: Module vị trí & Cập nhật trạng thái (Location & Availability)
- **Mục tiêu**: Cung cấp API cho Guide bật/tắt khả năng sẵn sàng nhận tour và gửi tọa độ GPS về hệ thống.
- **APIs**:
  - `PATCH /api/v1/guides/me/availability` (Cập nhật `isAvailable` trong `GuideProfile`).
  - `PUT /api/v1/users/me/location` (Cập nhật hoặc Upsert vị trí trong `user_current_locations` bằng lệnh Raw SQL `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`).

---

### Giai đoạn 3: Động cơ truy vấn không gian PostGIS (Geospatial Engine)
- **Mục tiêu**: Xây dựng service tính toán khoảng cách và tìm kiếm trong bán kính.
- **Thành phần**:
  - `GeospatialService` / `LocationService`.
  - Viết truy vấn `prisma.$queryRaw` sử dụng hàm `ST_DWithin(location, center_point, radius_in_meters)` và `ST_Distance` để tính khoảng cách chính xác theo km.
  - Xử lý lọc bỏ vị trí quá hạn (`expires_at > NOW()`).

---

### Giai đoạn 4: API tìm kiếm Guide gần đây (Nearby Guides API)
- **Mục tiêu**: Hoàn thiện API `GET /api/v1/guides/nearby` cho Client.
- **Thành phần**:
  - `FindNearbyGuidesDto` (Validate `latitude`, `longitude`, `radiusKm`, `page`, `limit`).
  - Phân trang kết quả, kết hợp lấy ngôn ngữ của Guide (`GuideLanguage` -> `Language`).
  - Trả về dữ liệu đính kèm metadata phân trang và tham số tìm kiếm.

---

### Giai đoạn 5: API Hồ sơ cá nhân & Khởi tạo Guide Request
- **Mục tiêu**: Cho phép Tourist xem profile chi tiết và tạo yêu cầu hướng dẫn.
- **APIs**:
  - `GET /api/v1/guides/:guideId` (Trả về tiểu sử, số năm kinh nghiệm, đánh giá trung bình, ngôn ngữ).
  - `POST /api/v1/guide-requests` (Khởi tạo bản ghi `GuideRequest` ở trạng thái `PENDING`).

---

## 3. Các lưu ý kỹ thuật & Hiệu năng (Technical & Performance Considerations)

1. **Hiệu năng truy vấn GiST Index**:
   Tất cả các câu lệnh tìm kiếm trong bán kính đều bắt buộc sử dụng `ST_DWithin` trên cột kiểu `GEOGRAPHY` có đánh chỉ mục **GiST (Generalized Search Tree)** để đảm bảo hệ thống không bị chậm khi số lượng Guide lên đến hàng trăm nghìn bản ghi.
2. **Loại bỏ vị trí quá hạn (Stale GPS Filter)**:
   Mỗi bản ghi vị trí trong `user_current_locations` có cột `expires_at` (Ví dụ: hết hạn sau 24h nếu Guide không cập nhật). Truy vấn bắt buộc bổ sung điều kiện `(expires_at IS NULL OR expires_at > NOW())`.
3. **Phân quyền và bảo vệ Endpoint**:
   Các endpoint cập nhật vị trí và trạng thái sẵn sàng yêu cầu Guard `JwtAuthGuard` và kiểm tra User có role `GUIDE`.
