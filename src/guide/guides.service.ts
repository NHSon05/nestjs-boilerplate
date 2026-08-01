import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateGuideProfileDto } from './dto/update-guide-profile.dto';
import { AddGuideLanguageDto } from './dto/guide-language.dto';
import { GeospatialService } from 'src/geospatial/geospatial.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { FindNearbyGuidesDto } from 'src/locations/dto/find-nearby-guides.dto';

@Injectable()
export class GuidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geospatialService: GeospatialService,
  ) {}

  private async validateGuideUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user.role !== UserRole.GUIDE) {
      throw new ForbiddenException(
        'Chỉ có GUIDE mới thực hiện được thao tác này',
      );
    }

    return user;
  }

  async updateMyProfile(userId: string, dto: UpdateGuideProfileDto) {
    await this.validateGuideUser(userId);

    const dataToUpdate: Prisma.GuideProfileUpdateInput = {};

    if (dto.bio !== undefined) {
      dataToUpdate.bio = dto.bio;
    }
    if (dto.city !== undefined) {
      dataToUpdate.city = dto.city;
    }
    if (dto.country !== undefined) {
      dataToUpdate.country = dto.country;
    }
    if (dto.currency !== undefined) {
      dataToUpdate.currency = dto.currency;
    }
    if (dto.hourlyRate !== undefined) {
      dataToUpdate.hourlyRate = dto.hourlyRate;
    }
    if (dto.yearsExperience !== undefined) {
      dataToUpdate.yearsExperience = dto.yearsExperience;
    }

    return this.prisma.guideProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: dto.bio,
        city: dto.city,
        country: dto.country,
        currency: dto.currency,
        hourlyRate: dto.hourlyRate,
        yearsExperience: dto.yearsExperience,
      },
      update: dataToUpdate,
      include: {
        languages: {
          include: {
            language: true,
          },
        },
      },
    });
  }

  async getMyLanguages(userId: string) {
    await this.validateGuideUser(userId);

    return this.prisma.guideLanguage.findMany({
      where: { guideId: userId },
      include: {
        language: true,
      },
    });
  }

  async addLanguage(userId: string, dto: AddGuideLanguageDto) {
    await this.validateGuideUser(userId);

    const targetLanguage = await this.prisma.language.findUnique({
      where: { id: dto.languageId },
    });

    if (!targetLanguage) {
      throw new NotFoundException('Ngôn ngữ không tồn tại trong hệ thống');
    }

    return this.prisma.guideLanguage.upsert({
      where: {
        guideId_languageId: {
          guideId: userId,
          languageId: dto.languageId,
        },
      },
      create: {
        guideId: userId,
        languageId: dto.languageId,
        proficiencyLevel: dto.proficiencyLevel,
      },
      update: {
        proficiencyLevel: dto.proficiencyLevel,
      },
      include: {
        language: true,
      },
    });
  }

  async removeLanguage(userId: string, languageId: string) {
    await this.validateGuideUser(userId);

    const existingRelation = await this.prisma.guideLanguage.findUnique({
      where: {
        guideId_languageId: {
          guideId: userId,
          languageId,
        },
      },
    });

    if (!existingRelation) {
      throw new NotFoundException(
        'Ngôn ngữ chưa có trong danh sách hồ sơ của bạn',
      );
    }

    await this.prisma.guideLanguage.delete({
      where: {
        guideId_languageId: {
          guideId: userId,
          languageId,
        },
      },
    });

    return { message: 'Đã xóa ngôn ngữ khỏi hồ sơ thành công' };
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        guideProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    if (user.role !== UserRole.GUIDE) {
      throw new ForbiddenException('Bạn cần chuyển sang chế độ GUIDE');
    }
    if (!user.guideProfile) {
      throw new BadRequestException('Hồ sơ Guide chưa tồn tại');
    }
    if (dto.isAvailable) {
      const hasValidLocation =
        await this.geospatialService.hasValidCurrentLocation(userId);

      if (!hasValidLocation) {
        throw new BadRequestException(
          'Bạn cần cập nhật vị trí hiện tại trước khi bật trạng thái sẵn sàng',
        );
      }
    }
    const profile = await this.prisma.guideProfile.update({
      where: { userId },
      data: {
        isAvailable: dto.isAvailable,
      },
      select: {
        userId: true,
        isAvailable: true,
        updatedAt: true,
      },
    });
    return {
      message: dto.isAvailable
        ? 'Bạn đang sẵn sàng nhận yêu cầu'
        : 'Bạn đã tắt trạng thái sẵn sàng',
      data: profile,
    };
  }
  async findNearby(currentUserId: string, dto: FindNearbyGuidesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const radiusKm = dto.radiusKm ?? 5;
    const availableOnly = dto.availableOnly ?? true;

    const radiusMeters = radiusKm * 1000;
    const offset = (page - 1) * limit;

    const params = {
      currentUserId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusMeters,
      availableOnly,
    };

    const [guides, total] = await Promise.all([
      this.geospatialService.findNearbyGuides({
        ...params,
        limit,
        offset,
      }),
      this.geospatialService.countNearbyGuides(params),
    ]);
    return {
      data: guides,
      search: {
        center: {
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
        radiusKm,
        availableOnly,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getPublicProfile(guideId: string) {
    const guide = await this.prisma.guideProfile.findUnique({
      where: {
        userId: guideId,
      },
      select: {
        userId: true,
        bio: true,
        yearsExperience: true,
        hourlyRate: true,
        isAvailable: true,
        verificationStatus: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            status: true,
            deletedAt: true,
          },
        },

        languages: {
          select: {
            proficiencyLevel: true,

            language: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!guide || guide.user.deletedAt || guide.user.status !== 'ACTIVE') {
      throw new NotFoundException('Không tìm thấy hướng dẫn viên');
    }

    const location = guide.isAvailable
      ? await this.geospatialService.getCurrentLocation(guideId)
      : null;

    return {
      data: {
        id: guide.user.id,
        fullName: guide.user.fullName,
        avatarUrl: guide.user.avatarUrl,

        bio: guide.bio,
        yearsExperience: guide.yearsExperience,
        hourlyRate: guide.hourlyRate,
        isAvailable: guide.isAvailable,
        verificationStatus: guide.verificationStatus,
        averageRating: guide.averageRating,
        reviewCount: guide.reviewCount,

        languages: guide.languages.map((item) => ({
          id: item.language.id,
          code: item.language.code,
          name: item.language.name,
          proficiencyLevel: item.proficiencyLevel,
        })),

        location,

        createdAt: guide.createdAt,
        updatedAt: guide.updatedAt,
      },
    };
  }
}
