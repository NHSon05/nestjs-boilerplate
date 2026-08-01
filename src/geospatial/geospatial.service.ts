import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

export interface NearbyGuideRow {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  yearsExperience: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  locationUpdatedAt: Date;
  distanceMeters: number;
  distanceKm: number;
}

export interface FindNearbyGuidesParams {
  currentUserId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  limit: number;
  offset: number;
  availableOnly: boolean;
}

@Injectable()
export class GeospatialService {
  constructor(private readonly prisma: PrismaService) {}

  async findNearbyGuides(
    params: FindNearbyGuidesParams,
  ): Promise<NearbyGuideRow[]> {
    const availableCondition = params.availableOnly
      ? Prisma.sql`AND gp."is_available" = TRUE`
      : Prisma.empty;

    return this.prisma.$queryRaw<NearbyGuideRow[]>(
      Prisma.sql`
        WITH search_point AS (
          SELECT ST_SetSRID(
            ST_MakePoint(
              ${params.longitude},
              ${params.latitude}
            ),
            4326
          ) :: geography AS point
        )
        SELECT
          u."id"
          u."full_name" AS "fullName",
          u."avatar_url" AS "avatarUrl",

           gp."bio",
          gp."years_experience" AS "yearsExperience",
          gp."hourly_rate"::float8 AS "hourlyRate",
          gp."is_available" AS "isAvailable",
          gp."average_rating"::float8 AS "averageRating",
          gp."total_reviews" AS "totalReviews",

          ucl."latitude"::float8 AS "latitude",
          ucl."longitude"::float8 AS "longitude",
          ucl."accuracy_meters"::float8 AS "accuracyMeters",
          ucl."updated_at" AS "locationUpdatedAt",

          ST_Distance(
            ucl."location",
            sp.point
          )::float8 AS "distanceMeters",

          ROUND(
            (
              ST_Distance(
                ucl."location",
                sp.point
              ) / 1000.0
            )::numeric,
            2
          )::float8 AS "distanceKm"

          FROM "users" u

        INNER JOIN "guide_profiles" gp
          ON gp."user_id" = u."id"

        INNER JOIN "user_current_locations" ucl
          ON ucl."user_id" = u."id"

        CROSS JOIN search_point sp

        WHERE
          u."status" = 'ACTIVE'
          AND u."deleted_at" IS NULL
          AND u."id" <> ${params.currentUserId}::uuid
          
          ${availableCondition}

          AND ucl."expires_at" > NOW()

          AND ST_DWithin(
            ucl."location",
            sp.point,
            ${params.radiusMeters}
          )

        ORDER BY
          "distanceMeters" ASC,
          gp."average_rating" DESC

        LIMIT ${params.limit}
        OFFSET ${params.offset}
      `,
    );
  }

  async countNearbyGuides(
    params: Omit<FindNearbyGuidesParams, 'limit' | 'offset'>,
  ): Promise<number> {
    const availableCondition = params.availableOnly
      ? Prisma.sql`AND gp."is_available" = TRUE`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        WITH search_point AS (
          SELECT ST_SetSRID(
            ST_MakePoint(
              ${params.longitude},
              ${params.latitude}
            ),
            4326
          )::geography AS point
        )
        SELECT COUNT(*)::bigint AS "total"

        FROM "users" u

        INNER JOIN "guide_profiles" gp
          ON gp."user_id" = u."id"

        INNER JOIN "user_current_locations" ucl
          ON ucl."user_id" = u."id"

        CROSS JOIN search_point sp

        WHERE
          u."status" = 'ACTIVE'
          AND u."deleted_at" IS NULL
          AND u."id" <> ${params.currentUserId}::uuid

          ${availableCondition}

          AND ucl."expires_at" > NOW()

          AND ST_DWithin(
            ucl."location",
            sp.point,
            ${params.radiusMeters}
          )
      `,
    );
    return Number(rows[0]?.total ?? 0);
  }
  async hasValidCurrentLocation(userId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM "user_current_locations"
        WHERE "user_id" = ${userId}::uuid
          AND "expires_at" > NOW()
      ) AS "exists"
    `;
    return rows[0]?.exists ?? false;
  }
  async getCurrentLocation(userId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        latitude: number;
        longitude: number;
        accuracyMeters: number | null;
        capturedAt: Date;
        updatedAt: Date;
        expiresAt: Date | null;
      }>
    >`
     SELECT
        "latitude"::float8 AS "latitude",
        "longitude"::float8 AS "longitude",
        "accuracy_meters"::float8
          AS "accuracyMeters",
        "captured_at" AS "capturedAt",
        "updated_at" AS "updatedAt",
        "expires_at" AS "expiresAt"
      FROM "user_current_locations"
      WHERE "user_id" = ${userId}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
}
