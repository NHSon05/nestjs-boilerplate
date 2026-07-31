/*
  Warnings:

  - Added the required column `location` to the `user_current_locations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "user_current_locations"
ADD COLUMN "location" geography(Point,4326) NOT NULL;

CREATE INDEX "user_current_locations_location_gist_idx"
ON "user_current_locations"
USING GIST ("location");