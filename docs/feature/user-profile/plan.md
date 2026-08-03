# Implementation Plan: Feature User Profile (Feature Plan)

Document này định nghĩa kiến trúc tổng quan và lộ trình triển khai chi tiết từng bước cho tính năng **Quản lý Hồ sơ Người dùng (User Profile)**.

---

## 1. Sơ đồ kiến trúc (System Architecture)

```
[ Mobile / Web Client ]
       │
       ├──── REST API (HTTPS) ─────────► [ NestJS Controllers ]
       │                                 ├── UsersController (/users)
       │                                 ├── TouristController (/tourists)
       │                                 └── GuidesController (/guides)
       │                                         │
       ▼                                         ▼
[ Cloudinary Storage Service ]          [ Prisma ORM / PostgreSQL ]
  (Avatar Media Storage)                 ├── Table: users
                                         ├── Table: tourist_profiles
                                         └── Table: guide_profiles
```

---

## 2. Kế hoạch triển khai từng bước (Phased Implementation Strategy)

---

### Giai đoạn 1: Thông tin cá nhân cơ bản (Core Profile APIs)
- **Mục tiêu**: Xây dựng API xem và cập nhật thông tin cá nhân cơ bản.
- **Thành phần**:
  - `UsersModule`, `UsersController`, `UsersService`.
  - DTO `UpdateUserDto` (`fullName`, `gender`, `dateOfBirth`).
  - Endpoint `GET /api/v1/users/me` và `PATCH /api/v1/users/me`.

---

### Giai đoạn 2: Hồ sơ chi tiết theo vai trò (Tourist & Guide Profiles)
- **Mục tiêu**: Cung cấp API cập nhật chuyên biệt cho Tourist và Guide.
- **Thành phần**:
  - `TouristModule`, `TouristService`, `TouristController`: DTO `UpdateTouristProfileDto` (`nationality`, `preferredLanguage`, `interests`, `travelPreferences`).
  - `GuidesModule`, `GuidesService`, `GuidesController`: DTO `UpdateGuideProfileDto` (`bio`, `yearsExperience`, `hourlyRate`, `city`, `country`, `currency`).

---

### Giai đoạn 3: Upload Avatar với Cloudinary Integration
- **Mục tiêu**: Hỗ trợ upload ảnh đại diện và lưu giữ trên Cloudinary.
- **Thành phần**:
  - Integrates `CloudinaryModule` & `CloudinaryService`.
  - Endpoint `POST /api/v1/users/me/avatar` tích hợp `FileInterceptor('file')`.
  - Logic dọn dẹp: Kiểm tra nếu `user.avatarPublicId` cũ tồn tại thì gọi `cloudinary.uploader.destroy(publicId)` trước khi lưu ảnh mới.

---

### Giai đoạn 4: Đổi mật khẩu & Chuyển đổi vai trò (Security & Role Switching)
- **Mục tiêu**: Bảo mật thay đổi mật khẩu và toggle nhanh vai trò người dùng.
- **Thành phần**:
  - DTO `ChangePasswordDto` (`oldPassword`, `newPassword`).
  - Logic xác thực bcrypt: So sánh `bcrypt.compare(oldPassword, user.passwordHash)`. Hash mật khẩu mới bằng bcrypt muối (salt).
  - DTO `SwitchRoleDto` (`role: TOURIST | GUIDE`) và endpoint `PATCH /api/v1/users/me/role`.

---

### Giai đoạn 5: Xem Hồ sơ Công khai & Bảo mật dữ liệu (Public Profile View)
- **Mục tiêu**: Cho phép xem hồ sơ công khai của người dùng khác mà không rò rỉ dữ liệu nhạy cảm.
- **Thành phần**:
  - Endpoint `GET /api/v1/users/:id`.
  - Prisma `select` linh hoạt lọc bỏ `passwordHash`, `refreshSessions`, `emailVerificationAt`, `deletedAt`.

---

## 3. Lưu ý Kỹ thuật & Bảo mật (Technical & Security Considerations)

1. **Bảo mật dữ liệu nhạy cảm**:
   Khi xuất dữ liệu công khai qua `GET /users/:id`, bắt buộc dùng Prisma `select` định danh chi tiết các trường được phép trả về, tuyệt đối không dùng `findUnique` trả về nguyên bản đối tượng `User`.
2. **Quản lý nguyên tử trên Cloudinary**:
   Khi người dùng upload avatar mới, quá trình upload nhận được `url` và `publicId`. Xóa avatar cũ phải được bọc xử lý ngoại lệ (try-catch) để đảm bảo không đứt đoạn luồng cập nhật nếu ảnh cũ trên Cloudinary đã bị xóa trước đó.
3. **Bảo vệ Mật khẩu**:
   Khi thực hiện `POST /users/change-password`, mật khẩu mới phải được kiểm tra độ mạnh (`MinLength(8)`, ký tự hoa, thường, số) và mã hóa bằng bcrypt trước khi lưu xuống database.
