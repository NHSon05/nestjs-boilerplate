# Task Checklist: Feature Tourist & Guide Profile (Feature Tasks)

Danh sách nhiệm vụ thực thi chi tiết theo thứ tự triển khai từng bước cho tính năng **Hồ sơ Chuyên biệt Tourist & Guide**.

---

## 1. Danh sách công việc (Checklist)

- [ ] **Task 1: Tourist Profile Module**
  - [ ] Kiểm tra DTO `UpdateTouristProfileDto` (`nationality`, `preferredLanguage`, `interests`, `travelPreferences`).
  - [ ] Implement `PATCH /api/v1/tourists/profile` trong `TouristController`.
  - [ ] Thêm logic validate `user.role === TOURIST` (ném `ForbiddenException` nếu không đúng role).

- [ ] **Task 2: Guide Profile Module**
  - [ ] Kiểm tra DTO `UpdateGuideProfileDto` (`bio`, `yearsExperience`, `hourlyRate`, `city`, `country`, `currency`).
  - [ ] Implement `PATCH /api/v1/guides/profile` trong `GuidesController`.
  - [ ] Thêm logic validate `user.role === GUIDE` (ném `ForbiddenException` nếu không đúng role).

- [ ] **Task 3: Guide Language Management Module**
  - [ ] Kiểm tra DTO `AddGuideLanguageDto` (`languageId`, `proficiencyLevel`).
  - [ ] Implement `GET /api/v1/guides/me/languages` lấy danh sách ngôn ngữ của Guide.
  - [ ] Implement `POST /api/v1/guides/me/languages` thêm mới / cập nhật trình độ ngôn ngữ.
  - [ ] Implement `DELETE /api/v1/guides/me/languages/:languageId` xóa ngôn ngữ khỏi hồ sơ.
