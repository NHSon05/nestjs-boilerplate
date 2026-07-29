import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateGuideProfileDto } from './dto/update-guide-profile.dto';
import { AddGuideLanguageDto } from './dto/guide-language.dto';

@Injectable()
export class GuidesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
