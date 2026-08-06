-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('GEMINI', 'OPENAI');

-- AlterEnum
ALTER TYPE "AiConversationStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "ai_conversations" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "system_instruction" TEXT;

-- AlterTable
ALTER TABLE "ai_messages" ADD COLUMN     "finish_reason" TEXT,
ADD COLUMN     "total_tokens" INTEGER;

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "device_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_is_active_idx" ON "device_tokens"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_status_updated_at_idx" ON "ai_conversations"("user_id", "status", "updated_at");

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
