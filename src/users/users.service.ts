import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: {
        phone: phone.trim(),
      },
      include: {
        guideProfile: true,
        touristProfile: true,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        guideProfile: true,
        touristProfile: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        guideProfile: true,
        touristProfile: true,
      },
    });
  }

  async getProfile(userId: string) {
    let user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Tự động tạo bù Profile nếu tài khoản chưa có profile tương ứng trong DB
    if (user.role === UserRole.TOURIST && !user.touristProfile) {
      await this.prisma.touristProfile.create({
        data: { userId: user.id },
      });
      user = await this.findById(userId);
    } else if (user.role === UserRole.GUIDE && !user.guideProfile) {
      await this.prisma.guideProfile.create({
        data: { userId: user.id },
      });
      user = await this.findById(userId);
    }

    return this.sanitizeUser(user!);
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        }),
      },
      include: {
        guideProfile: true,
        touristProfile: true,
      },
    });

    return this.sanitizeUser(updatedUser);
  }

  create(data: {
    phone: string;
    email: string;
    fullName: string;
    passwordHash: string;
    role?: UserRole;
  }) {
    const role = data.role ?? UserRole.TOURIST;
    return this.prisma.user.create({
      data: {
        phone: data.phone.trim(),
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        passwordHash: data.passwordHash,
        role: role,

        guideProfile:
          role === UserRole.GUIDE
            ? {
                create: {},
              }
            : undefined,
        touristProfile:
          role === UserRole.TOURIST
            ? {
                create: {},
              }
            : undefined,
      },
      include: {
        guideProfile: true,
        touristProfile: true,
      },
    });
  }

  private sanitizeUser<T extends { passwordHash?: string }>(user: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
