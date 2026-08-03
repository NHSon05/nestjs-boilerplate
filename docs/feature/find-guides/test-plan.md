# Test Plan: Feature Find Nearby Guides (Test Plan)

Document này mô tả chiến lược kiểm thử, kịch bản kiểm thử (Test Cases) và tiêu chí nghiệm thu cho tính năng **Tìm kiếm Hướng dẫn viên gần đây**.

---

## 1. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing**: Kiểm thử độc lập các service phương thức tính khoảng cách, chuyển đổi tọa độ và validate DTO (`LocationsService`, `GuidesService`, `GeospatialService`).
- **PostGIS Integration Testing**: Kiểm thử truy vấn SQL không gian thực tế với PostgreSQL/PostGIS.
- **API E2E Testing**: Kiểm thử toàn bộ vòng đời từ khi Guide bật sẵn sàng, gửi vị trí GPS đến khi Tourist tìm kiếm trên bản đồ và tạo `GuideRequest`.

---

## 2. Kịch bản kiểm thử chi tiết (Test Cases)

### 2.1. Cập nhật Vị trí & Trạng thái Sẵn sàng
- [ ] **TC-AVAIL-01**: Guide bật sẵn sàng (`PATCH /guides/me/availability` với `isAvailable: true`) -> Kết quả mong đợi: `isAvailable` trong database cập nhật thành `true`.
- [ ] **TC-LOC-01**: Guide gửi vị trí GPS hợp lệ (`PUT /users/me/location` với `latitude: 15.8872`, `longitude: 108.3421`) -> Kết quả mong đợi: Tạo hoặc cập nhật bản ghi trong `user_current_locations`, tọa độ PostGIS Point khởi tạo đúng với SRID 4326.

---

### 2.2. Tìm kiếm Guide gần đây (PostGIS Spatial Queries)
- [ ] **TC-NEARBY-01**: Tourist tìm kiếm với tọa độ Hội An và bán kính 5 km -> Kết quả mong đợi: Trả về danh sách các Guide nằm trong bán kính 5 km kèm khoảng cách `distanceKm` được sắp xếp tăng dần.
- [ ] **TC-NEARBY-02**: Guide ở khoảng cách 6 km (ngoài bán kính 5 km) -> Kết quả mong đợi: Không xuất hiện trong danh sách trả về.
- [ ] **TC-NEARBY-03**: Guide có vị trí trong bán kính 5 km nhưng tắt sẵn sàng (`isAvailable = false`) -> Kết quả mong đợi: Bị loại khỏi danh sách tìm kiếm.
- [ ] **TC-NEARBY-04**: Guide có vị trí GPS đã hết hạn (`expires_at < NOW()`) -> Kết quả mong đợi: Bị loại khỏi danh sách tìm kiếm.
- [ ] **TC-NEARBY-05**: User hiện tại đang đăng nhập là một Guide nằm trong bán kính -> Kết quả mong đợi: Không hiển thị chính mình trong danh sách kết quả tìm kiếm.

---

### 2.3. Xem Hồ sơ & Gửi Yêu cầu (Profile & Request)
- [ ] **TC-PROF-01**: Xem profile công khai của Guide (`GET /guides/:guideId`) -> Trả về chi tiết `GuideProfile`, danh sách ngôn ngữ và điểm đánh giá trung bình.
- [ ] **TC-PROF-02**: Xem profile với `guideId` không tồn tại -> Trả về lỗi `404 Not Found`.
- [ ] **TC-REQ-01**: Tourist gửi `GuideRequest` cho Guide (`POST /guide-requests`) -> Tạo thành công yêu cầu ở trạng thái `PENDING`.
- [ ] **TC-REQ-02**: Tourist gửi `GuideRequest` tự gửi cho chính mình -> Trả về lỗi `400 Bad Request`.
