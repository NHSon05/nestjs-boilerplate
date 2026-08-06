/*
  Warnings:

  - The values [SENT] on the enum `NotificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [NEW_MESSAGE,NEW_REVIEW] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationStatus_new" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');
ALTER TABLE "public"."notifications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "notifications" ALTER COLUMN "status" TYPE "NotificationStatus_new" USING ("status"::text::"NotificationStatus_new");
ALTER TYPE "NotificationStatus" RENAME TO "NotificationStatus_old";
ALTER TYPE "NotificationStatus_new" RENAME TO "NotificationStatus";
DROP TYPE "public"."NotificationStatus_old";
ALTER TABLE "notifications" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('GUIDE_REQUEST_RECEIVED', 'GUIDE_REQUEST_ACCEPTED', 'GUIDE_REQUEST_REJECTED', 'GUIDE_REQUEST_CANCELLED', 'MESSAGE_RECEIVED', 'CALL_INCOMING', 'CALL_ACCEPTED', 'CALL_REJECTED', 'CALL_CANCELLED', 'CALL_MISSED', 'CALL_ENDED', 'TRIP_REMINDER', 'TRIP_COMPLETED', 'REVIEW_AVAILABLE', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropIndex
DROP INDEX "notifications_user_id_status_created_at_idx";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "failed_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_deleted_at_created_at_idx" ON "notifications"("user_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_status_created_at_idx" ON "notifications"("status", "created_at");
