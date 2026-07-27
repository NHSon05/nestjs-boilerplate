/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ai_conversations` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `ai_conversations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ai_conversations` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ai_conversations` table. All the data in the column will be lost.
  - You are about to drop the column `completionTokens` on the `ai_messages` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `ai_messages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ai_messages` table. All the data in the column will be lost.
  - You are about to drop the column `promptTokens` on the `ai_messages` table. All the data in the column will be lost.
  - The primary key for the `conversation_members` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `conversationId` on the `conversation_members` table. All the data in the column will be lost.
  - You are about to drop the column `isMuted` on the `conversation_members` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `conversation_members` table. All the data in the column will be lost.
  - You are about to drop the column `lastReadAt` on the `conversation_members` table. All the data in the column will be lost.
  - You are about to drop the column `leftAt` on the `conversation_members` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `conversation_members` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `guideRequestId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `conversations` table. All the data in the column will be lost.
  - The primary key for the `guide_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `averageRating` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `yearsExperience` on the `guide_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `acceptedAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationReason` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `endAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `guideId` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `meetingAddress` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `meetingLatitude` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `meetingLongtitude` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `proposedPrice` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `touristId` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `guide_requests` table. All the data in the column will be lost.
  - You are about to drop the column `clientMessageId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `editedAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `replyToId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `deviceName` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `expriesAt` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsedAt` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `guideRequestId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `revieweeId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reviews` table. All the data in the column will be lost.
  - The primary key for the `tourist_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `tourist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguage` on the `tourist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `travelPreferences` on the `tourist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tourist_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `tourist_profiles` table. All the data in the column will be lost.
  - The primary key for the `user_current_locations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accuracyMeters` on the `user_current_locations` table. All the data in the column will be lost.
  - You are about to drop the column `capturedAt` on the `user_current_locations` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `user_current_locations` table. All the data in the column will be lost.
  - You are about to drop the column `longtitude` on the `user_current_locations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_current_locations` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_current_locations` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `user_location_history` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[guide_request_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sender_id,client_message_id]` on the table `messages` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_hash]` on the table `refresh_sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[guide_request_id,reviewer_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `ai_conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `ai_conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversation_id` to the `ai_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversation_id` to the `conversation_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `conversation_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `guide_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `guide_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_at` to the `guide_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guide_id` to the `guide_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_at` to the `guide_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tourist_id` to the `guide_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `guide_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversation_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_id` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guide_request_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewee_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewer_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tourist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `tourist_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `captured_at` to the `user_current_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `user_current_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_current_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_current_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ai_conversations" DROP CONSTRAINT "ai_conversations_userId_fkey";

-- DropForeignKey
ALTER TABLE "ai_messages" DROP CONSTRAINT "ai_messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_members" DROP CONSTRAINT "conversation_members_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_members" DROP CONSTRAINT "conversation_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_guideRequestId_fkey";

-- DropForeignKey
ALTER TABLE "guide_profiles" DROP CONSTRAINT "guide_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "guide_requests" DROP CONSTRAINT "guide_requests_guideId_fkey";

-- DropForeignKey
ALTER TABLE "guide_requests" DROP CONSTRAINT "guide_requests_touristId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_sessions" DROP CONSTRAINT "refresh_sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_revieweeId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "tourist_profiles" DROP CONSTRAINT "tourist_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_current_locations" DROP CONSTRAINT "user_current_locations_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_location_history" DROP CONSTRAINT "user_location_history_userId_fkey";

-- DropIndex
DROP INDEX "ai_conversations_userId_updatedAt_idx";

-- DropIndex
DROP INDEX "ai_messages_conversationId_createdAt_idx";

-- DropIndex
DROP INDEX "conversation_members_conversationId_key";

-- DropIndex
DROP INDEX "conversation_members_userId_idx";

-- DropIndex
DROP INDEX "conversations_guideRequestId_key";

-- DropIndex
DROP INDEX "conversations_lastMessageAt_idx";

-- DropIndex
DROP INDEX "guide_profiles_isAvailable_verificationStatus_idx";

-- DropIndex
DROP INDEX "guide_requests_guideId_status_createdAt_idx";

-- DropIndex
DROP INDEX "guide_requests_startAt_idx";

-- DropIndex
DROP INDEX "guide_requests_touristId_status_createdAt_idx";

-- DropIndex
DROP INDEX "messages_conversationId_sentAt_idx";

-- DropIndex
DROP INDEX "messages_senderId_clientMessageId_key";

-- DropIndex
DROP INDEX "notifications_userId_status_createdAt_idx";

-- DropIndex
DROP INDEX "refresh_sessions_tokenHash_key";

-- DropIndex
DROP INDEX "reviews_guideRequestId_reviewerId_key";

-- DropIndex
DROP INDEX "reviews_revieweeId_createdAt_idx";

-- DropIndex
DROP INDEX "user_current_locations_capturedAt_idx";

-- AlterTable
ALTER TABLE "ai_conversations" DROP COLUMN "createdAt",
DROP COLUMN "lastMessageAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_message_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ai_messages" DROP COLUMN "completionTokens",
DROP COLUMN "conversationId",
DROP COLUMN "createdAt",
DROP COLUMN "promptTokens",
ADD COLUMN     "completion_tokens" INTEGER,
ADD COLUMN     "conversation_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "prompt_tokens" INTEGER;

-- AlterTable
ALTER TABLE "conversation_members" DROP CONSTRAINT "conversation_members_pkey",
DROP COLUMN "conversationId",
DROP COLUMN "isMuted",
DROP COLUMN "joinedAt",
DROP COLUMN "lastReadAt",
DROP COLUMN "leftAt",
DROP COLUMN "userId",
ADD COLUMN     "conversation_id" UUID NOT NULL,
ADD COLUMN     "is_muted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_read_at" TIMESTAMPTZ(6),
ADD COLUMN     "left_at" TIMESTAMPTZ(6),
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("conversation_id", "user_id");

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "createdAt",
DROP COLUMN "guideRequestId",
DROP COLUMN "lastMessageAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guide_request_id" UUID,
ADD COLUMN     "last_message_at" TIMESTAMPTZ(6),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "guide_profiles" DROP CONSTRAINT "guide_profiles_pkey",
DROP COLUMN "averageRating",
DROP COLUMN "createdAt",
DROP COLUMN "hourlyRate",
DROP COLUMN "isAvailable",
DROP COLUMN "reviewCount",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
DROP COLUMN "verificationStatus",
DROP COLUMN "yearsExperience",
ADD COLUMN     "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hourly_rate" DECIMAL(12,0),
ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
ADD COLUMN     "verification_status" "GuideVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "years_experience" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "guide_profiles_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "guide_requests" DROP COLUMN "acceptedAt",
DROP COLUMN "cancellationReason",
DROP COLUMN "cancelledAt",
DROP COLUMN "completedAt",
DROP COLUMN "createdAt",
DROP COLUMN "endAt",
DROP COLUMN "guideId",
DROP COLUMN "meetingAddress",
DROP COLUMN "meetingLatitude",
DROP COLUMN "meetingLongtitude",
DROP COLUMN "proposedPrice",
DROP COLUMN "rejectedAt",
DROP COLUMN "startAt",
DROP COLUMN "touristId",
DROP COLUMN "updatedAt",
ADD COLUMN     "accepted_at" TIMESTAMPTZ(6),
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6),
ADD COLUMN     "completed_at" TIMESTAMPTZ(6),
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "end_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "guide_id" UUID NOT NULL,
ADD COLUMN     "meeting_address" TEXT,
ADD COLUMN     "meeting_latitude" DECIMAL(9,6),
ADD COLUMN     "meeting_longitude" DECIMAL(9,6),
ADD COLUMN     "proposed_price" DECIMAL(12,0),
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6),
ADD COLUMN     "start_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "tourist_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "clientMessageId",
DROP COLUMN "conversationId",
DROP COLUMN "deletedAt",
DROP COLUMN "editedAt",
DROP COLUMN "replyToId",
DROP COLUMN "senderId",
DROP COLUMN "sentAt",
ADD COLUMN     "client_message_id" TEXT,
ADD COLUMN     "conversation_id" UUID NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "edited_at" TIMESTAMPTZ(6),
ADD COLUMN     "reply_to_id" UUID,
ADD COLUMN     "sender_id" UUID NOT NULL,
ADD COLUMN     "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "createdAt",
DROP COLUMN "deliveredAt",
DROP COLUMN "readAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "delivered_at" TIMESTAMPTZ(6),
ADD COLUMN     "read_at" TIMESTAMPTZ(6),
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "refresh_sessions" DROP COLUMN "createdAt",
DROP COLUMN "deviceName",
DROP COLUMN "expriesAt",
DROP COLUMN "familyId",
DROP COLUMN "ipAddress",
DROP COLUMN "lastUsedAt",
DROP COLUMN "revokedAt",
DROP COLUMN "tokenHash",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device_name" TEXT,
ADD COLUMN     "expires_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "family_id" UUID NOT NULL,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "last_used_at" TIMESTAMPTZ(6),
ADD COLUMN     "revoked_at" TIMESTAMPTZ(6),
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "createdAt",
DROP COLUMN "guideRequestId",
DROP COLUMN "revieweeId",
DROP COLUMN "reviewerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "guide_request_id" UUID NOT NULL,
ADD COLUMN     "reviewee_id" UUID NOT NULL,
ADD COLUMN     "reviewer_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "tourist_profiles" DROP CONSTRAINT "tourist_profiles_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "preferredLanguage",
DROP COLUMN "travelPreferences",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "preferred_language" TEXT,
ADD COLUMN     "travel_preferences" JSONB,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "tourist_profiles_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "user_current_locations" DROP CONSTRAINT "user_current_locations_pkey",
DROP COLUMN "accuracyMeters",
DROP COLUMN "capturedAt",
DROP COLUMN "expiresAt",
DROP COLUMN "longtitude",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "accuracy_meters" DOUBLE PRECISION,
ADD COLUMN     "captured_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "longitude" DECIMAL(9,6) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "user_current_locations_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatarUrl",
DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "emailVerificationAt",
DROP COLUMN "fullName",
DROP COLUMN "lastLoginAt",
DROP COLUMN "passwordHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "email_verification_at" TIMESTAMP(3),
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- DropTable
DROP TABLE "user_location_history";

-- CreateTable
CREATE TABLE "user_location_histories" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "accuracy_meters" DOUBLE PRECISION,
    "source" "LocationSource" NOT NULL,
    "captured_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_location_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_location_histories_user_id_captured_at_idx" ON "user_location_histories"("user_id", "captured_at");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_updated_at_idx" ON "ai_conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "conversation_members_user_id_idx" ON "conversation_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_guide_request_id_key" ON "conversations"("guide_request_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "guide_profiles_is_available_verification_status_idx" ON "guide_profiles"("is_available", "verification_status");

-- CreateIndex
CREATE INDEX "guide_requests_guide_id_status_created_at_idx" ON "guide_requests"("guide_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "guide_requests_tourist_id_status_created_at_idx" ON "guide_requests"("tourist_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "guide_requests_start_at_idx" ON "guide_requests"("start_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_sent_at_idx" ON "messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_sender_id_client_message_id_key" ON "messages"("sender_id", "client_message_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "reviews_reviewee_id_created_at_idx" ON "reviews"("reviewee_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_guide_request_id_reviewer_id_key" ON "reviews"("guide_request_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "user_current_locations_captured_at_idx" ON "user_current_locations"("captured_at");

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_profiles" ADD CONSTRAINT "guide_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourist_profiles" ADD CONSTRAINT "tourist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_requests" ADD CONSTRAINT "guide_requests_tourist_id_fkey" FOREIGN KEY ("tourist_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_requests" ADD CONSTRAINT "guide_requests_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_guide_request_id_fkey" FOREIGN KEY ("guide_request_id") REFERENCES "guide_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_current_locations" ADD CONSTRAINT "user_current_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_location_histories" ADD CONSTRAINT "user_location_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
