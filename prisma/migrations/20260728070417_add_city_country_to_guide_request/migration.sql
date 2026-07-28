-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "LanguageProficiency" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'NATIVE');

-- AlterTable
ALTER TABLE "guide_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "tourist_profiles" ADD COLUMN     "interests" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "languages" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_languages" (
    "guide_id" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "proficiency_level" "LanguageProficiency" NOT NULL,

    CONSTRAINT "guide_languages_pkey" PRIMARY KEY ("guide_id","language_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE INDEX "guide_languages_language_id_idx" ON "guide_languages"("language_id");

-- CreateIndex
CREATE INDEX "guide_profiles_city_idx" ON "guide_profiles"("city");

-- CreateIndex
CREATE INDEX "guide_profiles_is_available_idx" ON "guide_profiles"("is_available");

-- CreateIndex
CREATE INDEX "guide_profiles_average_rating_idx" ON "guide_profiles"("average_rating");

-- AddForeignKey
ALTER TABLE "guide_languages" ADD CONSTRAINT "guide_languages_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guide_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_languages" ADD CONSTRAINT "guide_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
