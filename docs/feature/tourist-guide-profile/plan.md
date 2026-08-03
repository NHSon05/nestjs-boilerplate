# Implementation Plan: Feature Tourist & Guide Profile (Feature Plan)

Document này định nghĩa kiến trúc tổng quan và lộ trình triển khai chi tiết từng bước cho tính năng **Hồ sơ Chuyên biệt Tourist & Guide**.

---

## 1. Sơ đồ Kiến trúc Module (Module Architecture)

```
[ Mobile / Web Client ]
       │
       ├──── REST API (/tourists/profile) ──► [ TouristController ]
       │                                             │
       │                                     [ TouristService ]
       │                                             │
       ├──── REST API (/guides/profile) ────► [ GuidesController ]
       │                                             │
       └──── REST API (/guides/me/languages) ──► [ GuidesService ]
                                                     │
                                          [ Prisma ORM / PostgreSQL ]
                                          ├── Table: tourist_profiles
                                          ├── Table: guide_profiles
                                          ├── Table: languages
                                          └── Table: guide_languages
```

---

## 2. Kế hoạch triển khai từng bước (Phased Implementation Strategy)

### Giai đoạn 1: Tourist Profile Module
- **Mục tiêu**: Quản lý thông tin hồ sơ cho khách du lịch.
- **Thành phần**: `TouristModule`, `TouristController`, `TouristService`, `UpdateTouristProfileDto`.
- **Logic**: Upsert dữ liệu vào bảng `tourist_profiles`. Kiểm tra vai trò `user.role === UserRole.TOURIST`.

### Giai đoạn 2: Guide Profile Module
- **Mục tiêu**: Quản lý thông tin hồ sơ cho hướng dẫn viên.
- **Thành phần**: `GuidesModule`, `GuidesController`, `GuidesService`, `UpdateGuideProfileDto`.
- **Logic**: Upsert dữ liệu vào bảng `guide_profiles`. Kiểm tra vai trò `user.role === UserRole.GUIDE`.

### Giai đoạn 3: Guide Language Management Module
- **Mục tiêu**: Quản lý ngôn ngữ và trình độ của Guide (`GuideLanguage`).
- **Thành phần**: `AddGuideLanguageDto`, `UpdateGuideLanguageDto`.
- **Logic**:
  - `GET /guides/me/languages`: Join với bảng `languages` lấy mã code và tên hiển thị.
  - `POST /guides/me/languages`: Upsert theo cặp composite key `[guideId, languageId]`.
  - `DELETE /guides/me/languages/:languageId`: Xóa bản ghi trong `guide_languages`.

---

## 3. Lưu ý Kỹ thuật (Technical Considerations)

1. **Phân quyền vai trò nghiêm ngặt**:
   Mọi endpoint thuộc `TouristController` và `GuidesController` đều phải áp dụng Guard `JwtAuthGuard` và kiểm tra logic `user.role` từ database hoặc token payload.
2. **Quản lý liên kết Cascade**:
   Bảng `guide_languages` có ràng buộc khóa ngoại `onDelete: Cascade` với `GuideProfile` và `Language`, đảm bảo tính toàn vẹn dữ liệu khi user hoặc ngôn ngữ bị xóa.
