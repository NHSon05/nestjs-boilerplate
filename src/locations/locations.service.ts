import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateCurrentLocationDto } from './dto/update-current-location.dto';

export interface CurrentLocationResult {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: Date;
}

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCurrentLocation(userId: string, dto: UpdateCurrentLocationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    await this.prisma.$executeRaw`
        INSERT INTO "user_current_locations" (
            "user_id",
            "location",
            "latitude",
            "longitude",
            "accuracy_meters",
            "source",
            "captured_at",
            "updated_at",
            "expires_at"
        )
        VALUES (
            ${userId}::uuid,
            ST_SetSRID(
                ST_MakePoint(
                    ${dto.longitude},
                    ${dto.latitude}
                ),
                4326
            )::geography,
            ${dto.latitude},
            ${dto.longitude},
            ${dto.accuracy ?? null},
            'GPS'::"LocationSource",
            NOW(),
            NOW(),
            NULL
        )
        ON CONFLICT ("user_id")
        DO UPDATE SET
            "location" = EXCLUDED."location",
            "latitude" = EXCLUDED."latitude",
            "longitude" = EXCLUDED."longitude",
            "accuracy_meters" = EXCLUDED."accuracy_meters",
            "source" = EXCLUDED."source",
            "captured_at" = NOW(),
            "updated_at" = NOW()
    `;

    const locations = await this.prisma.$queryRaw<CurrentLocationResult[]>`
        SELECT
          "user_id" AS "userId",
          ST_Y("location"::geometry)::float8 AS "latitude",
          ST_X("location"::geometry)::float8 AS "longitude",
          "accuracy_meters"::float8 AS "accuracy",
          "updated_at" AS "updatedAt"
        FROM "user_current_locations"
        WHERE "user_id" = ${userId}::uuid
        LIMIT 1
    `;

    return {
      message: 'Cập nhật vị trí thành công',
      data: locations[0],
    };
  }

  async getMyCurrentLocation(userId: string) {
    const locations = await this.prisma.$queryRaw<CurrentLocationResult[]>`
        SELECT
          "user_id" AS "userId",
          ST_Y("location"::geometry)::float8 AS "latitude",
          ST_X("location"::geometry)::float8 AS "longitude",
          "accuracy_meters"::float8 AS "accuracy",
          "updated_at" AS "updatedAt"
        FROM "user_current_locations"
        WHERE "user_id" = ${userId}::uuid
        LIMIT 1
      `;

    return {
      data: locations[0] ?? null,
    };
  }
}
