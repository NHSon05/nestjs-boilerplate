import { Injectable } from '@nestjs/common';
import { UserRole } from 'generated/prisma';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }
  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
  create(data: {
    email: string;
    fullName: string;
    passwordHash: string;
    role?: UserRole;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });
  }
}
