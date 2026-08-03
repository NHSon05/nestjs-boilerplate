# Test Plan: Feature Tourist & Guide Profile (Test Plan)

Document này mô tả chiến lược kiểm thử, kịch bản kiểm thử (Test Cases) và tiêu chí nghiệm thu cho tính năng **Hồ sơ Chuyên biệt Tourist & Guide**.

---

## 1. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing**: Kiểm thử độc lập `TouristService` và `GuidesService`.
- **Integration Testing**: Kiểm thử phân quyền truy cập theo vai trò (`TOURIST` vs `GUIDE`) và thao tác dữ liệu liên kết `GuideLanguage`.

---

## 2. Kịch bản kiểm thử chi tiết (Test Cases)

### 2.1. Tourist Profile Tests
- [ ] **TC-TOURIST-01**: Tài khoản `TOURIST` gọi `PATCH /tourists/profile` với dữ liệu hợp lệ -> Trả về `200 OK` chứa thông tin profile vừa cập nhật.
- [ ] **TC-TOURIST-02**: Tài khoản `GUIDE` cố tình gọi `PATCH /tourists/profile` -> Trả về lỗi `403 Forbidden`.

### 2.2. Guide Profile Tests
- [ ] **TC-GUIDE-01**: Tài khoản `GUIDE` gọi `PATCH /guides/profile` với dữ liệu hợp lệ -> Trả về `200 OK` chứa thông tin profile vừa cập nhật.
- [ ] **TC-GUIDE-02**: Tài khoản `TOURIST` cố tình gọi `PATCH /guides/profile` -> Trả về lỗi `403 Forbidden`.

### 2.3. Guide Language Management Tests
- [ ] **TC-LANG-01**: Guide thêm mới ngôn ngữ hợp lệ (`POST /guides/me/languages`) -> Trả về `201 Created` kèm thông tin ngôn ngữ.
- [ ] **TC-LANG-02**: Guide lấy danh sách ngôn ngữ của mình (`GET /guides/me/languages`) -> Trả về danh sách ngôn ngữ kèm thông tin `code`, `name` và `proficiencyLevel`.
- [ ] **TC-LANG-03**: Guide xóa một ngôn ngữ đang có (`DELETE /guides/me/languages/:languageId`) -> Trả về `200 OK`.
- [ ] **TC-LANG-04**: Guide xóa một ngôn ngữ chưa từng đăng ký -> Trả về lỗi `404 Not Found`.
