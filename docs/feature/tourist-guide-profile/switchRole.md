### API

`PATCH /users/me/role`

Body:

```json
{
  "role": "GUIDE"
}
```

Không nên gửi toàn bộ hồ sơ chỉ để đổi role.

### Flow chuyển từ TOURIST sang GUIDE

User hiện tại: TOURIST
↓
PATCH /users/me/role
↓
Kiểm tra role mới
↓
Nếu chưa có GuideProfile → tạo GuideProfile
↓
Cập nhật User.role = GUIDE
↓
Trả lại User + profile hiện tại

### Ngược lại, khi chuyển từ GUIDE sang TOURIST:

Nếu chưa có TouristProfile → tạo TouristProfile
Cập nhật role = TOURIST
