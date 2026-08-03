# Test Plan: Feature User Profile (Test Plan)

Document này mô tả chiến lược kiểm thử, kịch bản kiểm thử (Test Cases) và tiêu chí nghiệm thu cho tính năng **Quản lý Hồ sơ Người dùng**.

---

## 1. Chiến lược kiểm thử (Testing Strategy)

- **Unit Testing**: Kiểm thử các service method xử lý logic hồ sơ (`UsersService`, `TouristService`, `GuidesService`).
- **Integration & E2E Testing**: Kiểm thử các API HTTP endpoints, mã mã hóa bcrypt và xử lý upload file Cloudinary.
- **Security Testing**: Kiểm thử xác thực token JWT, đổi mật khẩu và bảo mật trường dữ liệu khi xem public profile.

---

## 2. Kịch bản kiểm thử chi tiết (Test Cases)

### 2.1. Xem & Cập nhật Hồ sơ Cơ bản
- [ ] **TC-PROF-01**: User đã đăng nhập gọi `GET /users/me` -> Trả về `200 OK` chứa đầy đủ thông tin cá nhân kèm `touristProfile` / `guideProfile`.
- [ ] **TC-PROF-02**: Chưa đăng nhập gọi `GET /users/me` -> Trả về `401 Unauthorized`.
- [ ] **TC-PROF-03**: Cập nhật thông tin cơ bản (`PATCH /users/me` với `fullName: "Nguyen Van B"`) -> Trả về `200 OK`, họ tên được cập nhật thành công.

---

### 2.2. Hồ sơ Tourist & Guide chuyên biệt
- [ ] **TC-PROF-04**: Cập nhật Tourist profile (`PATCH /tourists/profile` với `nationality: "VN"`, `interests: ["Food"]`) -> Trả về `200 OK` chứa thông tin Tourist Profile mới.
- [ ] **TC-PROF-05**: Cập nhật Guide profile (`PATCH /guides/profile` với `hourlyRate: 250000`) -> Trả về `200 OK` chứa thông tin Guide Profile mới.

---

### 2.3. Upload Ảnh Đại Diện (Avatar Upload)
- [ ] **TC-AVATAR-01**: Upload file ảnh hợp lệ (jpg/png, < 5MB) qua `POST /users/me/avatar` -> Trả về `200 OK`, `avatarUrl` được cập nhật và ảnh được upload lên Cloudinary.
- [ ] **TC-AVATAR-02**: Upload file không đúng định dạng (ví dụ `.pdf` hoặc `.txt`) -> Trả về lỗi `400 Bad Request`.
- [ ] **TC-AVATAR-03**: Upload avatar mới khi đã có avatar cũ -> Xóa thành công avatar cũ trên Cloudinary và lưu avatar mới.

---

### 2.4. Đổi Mật Khẩu & Chuyển đổi Vai trò
- [ ] **TC-PASS-01**: Đổi mật khẩu thành công với `oldPassword` đúng và `newPassword` hợp lệ -> Trả về `200 OK`, đăng nhập lại bằng mật khẩu mới thành công.
- [ ] **TC-PASS-02**: Đổi mật khẩu với `oldPassword` không chính xác -> Trả về lỗi `400 Bad Request` hoặc `401 Unauthorized`.
- [ ] **TC-ROLE-01**: Chuyển đổi vai trò (`PATCH /users/me/role` với `role: "GUIDE"`) -> Trả về `200 OK`, vai trò đổi thành `GUIDE`.

---

### 2.5. Xem Hồ sơ Công khai (Public Profile Privacy)
- [ ] **TC-PUB-01**: Xem public profile người dùng khác (`GET /users/:id`) -> Trả về `200 OK` chứa thông tin công khai.
- [ ] **TC-PUB-02**: Kiểm tra kết quả trả về của `GET /users/:id` -> Đảm bảo **KHÔNG CÓ** các trường `passwordHash`, `refreshSessions`, `phone`, `deletedAt`.
- [ ] **TC-PUB-03**: Xem public profile với `:id` không tồn tại -> Trả về `404 Not Found`.
