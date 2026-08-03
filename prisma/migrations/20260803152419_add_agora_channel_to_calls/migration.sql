-- 1. Thêm cột channel_name tạm thời hỗ trợ NULL
ALTER TABLE "call_records" ADD COLUMN "channel_name" TEXT;

-- 2. Điền giá trị giả lập/duy nhất cho các bản ghi cũ (dùng ID bản ghi)
UPDATE "call_records" SET "channel_name" = "id"::text WHERE "channel_name" IS NULL;

-- 3. Ràng buộc NOT NULL cho cột
ALTER TABLE "call_records" ALTER COLUMN "channel_name" SET NOT NULL;

-- 4. Tạo UNIQUE index
CREATE UNIQUE INDEX "call_records_channel_name_key" ON "call_records"("channel_name");
