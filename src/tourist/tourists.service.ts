import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateTouristProfileDto } from './dto/update-tourist-profile.dto';

@Injectable()
export class TouristsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMyProfile(userId: string, dto: UpdateTouristProfileDto) {
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

    if (user.role !== UserRole.TOURIST) {
      throw new ForbiddenException(
        'Chỉ có tài khoản TOURIST mới được chỉnh sửa hồ sơ du khách',
      );
    }

    const dataToUpdate: Prisma.TouristProfileUpdateInput = {};

    if (dto.nationality !== undefined) {
      dataToUpdate.nationality = dto.nationality;
    }
    if (dto.preferredLanguage !== undefined) {
      dataToUpdate.preferredLanguage = dto.preferredLanguage;
    }
    if (dto.interests !== undefined) {
      dataToUpdate.interests = dto.interests;
    }
    if (dto.travelPreferences !== undefined) {
      dataToUpdate.travelPreferences = dto.travelPreferences;
    }

    return this.prisma.touristProfile.upsert({
      where: { userId },
      create: {
        userId,
        nationality: dto.nationality,
        preferredLanguage: dto.preferredLanguage,
        interests: dto.interests ?? [],
        travelPreferences: dto.travelPreferences,
      },
      update: dataToUpdate,
    });
  }
}
