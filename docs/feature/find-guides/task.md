# Task Checklist: Feature Find Nearby Guides (Feature Tasks)

Danh sách nhiệm vụ thực thi chi tiết theo thứ tự triển khai từng bước cho tính năng **Tìm kiếm Hướng dẫn viên gần đây**.

---

## 1. Danh sách công việc (Checklist)

- [ ] **Task 1: Khởi tạo tiện ích mở rộng PostGIS & Bảng dữ liệu**
  - [ ] Khởi tạo extension `postgis` trong PostgreSQL (`CREATE EXTENSION IF NOT EXISTS postgis;`).
  - [ ] Kiểm tra bảng `user_current_locations` trong `prisma/schema.prisma`.
  - [ ] Đảm bảo chỉ mục không gian GiST Index trên cột `location` đã được khởi tạo.

- [ ] **Task 2: API Cập nhật vị trí GPS & Trạng thái sẵn sàng**
  - [ ] Xây dựng DTO `UpdateAvailabilityDto` (`isAvailable: boolean`).
  - [ ] Xây dựng API `PATCH /api/v1/guides/me/availability` trong `GuidesController`.
  - [ ] Xây dựng DTO `UpdateCurrentLocationDto` (`latitude`, `longitude`, `accuracy`).
  - [ ] Xây dựng API `PUT /api/v1/users/me/location` trong `LocationController`.
  - [ ] Dùng `prisma.$executeRaw` để insert/upsert vị trí với `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`.

- [ ] **Task 3: Xây dựng Service truy vấn không gian PostGIS**
  - [ ] Xây dựng DTO `FindNearbyGuidesDto` (`latitude`, `longitude`, `radiusKm`, `page`, `limit`, `availableOnly`).
  - [ ] Viết truy vấn `prisma.$queryRaw` với `ST_DWithin` và `ST_Distance` để tìm Guide trong bán kính.
  - [ ] Bổ sung lọc theo `status = 'ACTIVE'`, `isAvailable = true`, `expires_at > NOW()`.
  - [ ] Loại trừ chính User đang thực hiện request (`user_id != currentUserId`).

- [ ] **Task 4: Tích hợp API Tìm kiếm Guide gần đây (`GET /guides/nearby`)**
  - [ ] Kết hợp thông tin ngôn ngữ (`languages`) và ảnh đại diện (`avatarUrl`).
  - [ ] Tính toán số trang `totalPages`, tổng số lượng `total` và trả về theo đúng định dạng JSON Spec.

- [ ] **Task 5: API Xem Profile công khai của Guide (`GET /guides/:guideId`)**
  - [ ] Lấy thông tin `GuideProfile`, `yearsExperience`, `hourlyRate`, `averageRating`, `reviewCount`, danh sách `languages`.
  - [ ] Xử lý trả về `404 NotFoundException` nếu không tìm thấy Guide.

- [ ] **Task 6: Tích hợp Tạo Yêu cầu Hướng dẫn (`POST /guide-requests`)**
  - [ ] Đảm bảo API `POST /api/v1/guide-requests` nhận `guideId`, tiêu đề, thời gian bắt đầu/kết thúc, địa điểm và mức giá đề xuất.
  - [ ] Kiểm tra tính hợp lệ của thời gian (`endAt > startAt`) và kiểm tra `guideId` có tồn tại hay không.
