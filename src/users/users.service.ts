import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';

const userIncludeOptions = {
  guideProfile: {
    include: {
      languages: {
        include: {
          language: true,
        },
      },
    },
  },
  touristProfile: true,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: {
        phone: phone.trim(),
      },
      include: userIncludeOptions,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: userIncludeOptions,
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userIncludeOptions,
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

    const dataToUpdate: Prisma.UserUpdateInput = {};

    if (dto.fullName !== undefined) {
      dataToUpdate.fullName = dto.fullName.trim();
    }
    if (dto.gender !== undefined) {
      dataToUpdate.gender = dto.gender;
    }
    if (dto.dateOfBirth !== undefined) {
      dataToUpdate.dateOfBirth = dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: userIncludeOptions,
    });

    return this.sanitizeUser(updatedUser);
  }

  async switchRole(userId: string, dto: SwitchRoleDto) {
    if (dto.role !== UserRole.GUIDE && dto.role !== UserRole.TOURIST) {
      throw new BadRequestException('Chỉ có thể chuyển giữa TOURIST và GUIDE');
    }
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          guideProfile: {
            select: { userId: true },
          },
          touristProfile: {
            select: { userId: true },
          },
        },
      });
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }
      if (user.role === dto.role) {
        throw new BadRequestException(`Tài khoản đã ở chế độ ${dto.role}`);
      }

      if (dto.role === UserRole.GUIDE && !user.guideProfile) {
        await tx.guideProfile.create({
          data: {
            userId,
          },
        });
      }
      if (dto.role === UserRole.TOURIST && !user.touristProfile) {
        await tx.touristProfile.create({
          data: {
            userId,
          },
        });
      }
      return tx.user.update({
        where: { id: userId },
        data: {
          role: dto.role,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          avatarUrl: true,
          role: true,
          status: true,
          guideProfile: true,
          touristProfile: true,
        },
      });
    });
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
      include: userIncludeOptions,
    });
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    console.log(user);

    if (user.avatarPublicId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.cloudinaryService.deleteImage(user.avatarPublicId);
      } catch (error) {
        console.error('Không thể xóa ảnh đại diện cũ trên Cloudinary:', error);
      }
    }

    const uploadResult = await this.cloudinaryService.uploadAvatar(
      file,
      userId,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: uploadResult.url,
        avatarPublicId: uploadResult.publicId,
      },
      include: userIncludeOptions,
    });

    return this.sanitizeUser(updatedUser);
  }

  private sanitizeUser<T extends { passwordHash?: string }>(user: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
