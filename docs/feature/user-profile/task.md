# Task Checklist: Feature User Profile (Feature Tasks)

Danh sách nhiệm vụ thực thi chi tiết theo thứ tự triển khai từng bước cho tính năng **Quản lý Hồ sơ Người dùng**.

---

## 1. Danh sách công việc (Checklist)

- [ ] **Task 1: Kiểm tra DTO & Data Validation Setup**
  - [ ] Kiểm tra `UpdateUserDto` (`fullName`, `gender`, `dateOfBirth`).
  - [ ] Kiểm tra `UpdateTouristProfileDto` (`nationality`, `preferredLanguage`, `interests`, `travelPreferences`).
  - [ ] Kiểm tra `UpdateGuideProfileDto` (`bio`, `yearsExperience`, `hourlyRate`, `city`, `country`, `currency`).
  - [ ] Kiểm tra `SwitchRoleDto` (`role`).
  - [ ] Tạo DTO `ChangePasswordDto` (`oldPassword`, `newPassword`).

- [ ] **Task 2: API Xem & Cập nhật Thông tin cá nhân cơ bản**
  - [ ] Xây dựng method `getMe(userId)` trong `UsersService`.
  - [ ] Xây dựng API `GET /api/v1/users/me` trong `UsersController`.
  - [ ] Xây dựng method `updateMe(userId, dto)` trong `UsersService`.
  - [ ] Xây dựng API `PATCH /api/v1/users/me` trong `UsersController`.

- [ ] **Task 3: API Cập nhật Hồ sơ Tourist & Guide chuyên biệt**
  - [ ] Xây dựng API `PATCH /api/v1/tourists/profile` trong `TouristController`.
  - [ ] Xây dựng API `PATCH /api/v1/guides/profile` trong `GuidesController`.

- [ ] **Task 4: Upload Ảnh Đại Diện (Avatar Upload)**
  - [ ] Tích hợp `CloudinaryService` trong `UsersModule`.
  - [ ] Xây dựng API `POST /api/v1/users/me/avatar` với `@UseInterceptors(FileInterceptor('file'))`.
  - [ ] Xử lý dọn dẹp xóa file cũ trên Cloudinary khi upload thành công ảnh mới.

- [ ] **Task 5: Chức năng Đổi Mật Khẩu**
  - [ ] Xây dựng method `changePassword(userId, dto)` trong `UsersService`.
  - [ ] Kiểm tra `oldPassword` với `bcrypt.compare`.
  - [ ] Hash `newPassword` bằng `bcrypt.hash` và lưu xuống database.
  - [ ] Xây dựng API `POST /api/v1/users/change-password`.

- [ ] **Task 6: Chuyển đổi Vai trò (Role Switching)**
  - [ ] Xây dựng API `PATCH /api/v1/users/me/role` cập nhật trường `role` trong `User`.

- [ ] **Task 7: API Xem Hồ sơ Công khai (Get Public Profile)**
  - [ ] Xây dựng API `GET /api/v1/users/:id`.
  - [ ] Cấu hình Prisma `select` ẩn toàn bộ các trường nhạy cảm (`passwordHash`, `refreshSessions`, `emailVerificationAt`, `deletedAt`).
