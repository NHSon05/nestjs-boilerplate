-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "channel" SET DEFAULT 'IN_APP';
