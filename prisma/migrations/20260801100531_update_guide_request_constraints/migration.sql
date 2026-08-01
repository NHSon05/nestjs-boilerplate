/*
  Warnings:

  - You are about to alter the column `proposed_price` on the `guide_requests` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,0)` to `Decimal(12,2)`.

*/
-- AlterEnum
ALTER TYPE "GuideRequestStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_guide_request_id_fkey";

-- AlterTable
ALTER TABLE "guide_requests" 
  ADD COLUMN "expires_at" TIMESTAMPTZ(6),
  ADD COLUMN "meeting_name" TEXT,
  ADD COLUMN "meeting_place_id" TEXT,
  ADD COLUMN "rejection_reason" TEXT,
  ALTER COLUMN "proposed_price" SET DATA TYPE DECIMAL(12,2),
  ADD CONSTRAINT "guide_requests_different_users_check" 
    CHECK ("tourist_id" <> "guide_id"),
  ADD CONSTRAINT "guide_requests_valid_time_check" 
    CHECK ("end_at" > "start_at"),
  ADD CONSTRAINT "guide_requests_non_negative_price_check" 
    CHECK ("proposed_price" IS NULL OR "proposed_price" >= 0);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_guide_request_id_fkey" FOREIGN KEY ("guide_request_id") REFERENCES "guide_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
