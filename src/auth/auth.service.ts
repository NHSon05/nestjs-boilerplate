import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? 12,
    );

    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      email,
      fullName: dto.fullName.trim(),
      passwordHash,
      role: dto.role,
    });

    const tokens = await this.createSessionAndTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không thể đăng nhập');
    }
    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatched) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }
    const tokens = await this.createSessionAndTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }
  private async createSessionAndTokens(user: {
    id: string;
    email: string;
    role: string;
  }) {
    const sessionId = randomUUID();
    const refreshToken = await this.signRefreshToken(user, sessionId);
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash,
        familyId: randomUUID(),
        expriesAt: this.getRefreshTokenExpiresAt(),
      },
    });

    const accessToken = await this.signAccessToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  private signAccessToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
          '15m') as JwtSignOptions['expiresIn'],
      },
    );
  }

  private signRefreshToken(
    user: {
      id: string;
      email: string;
      role: string;
    },
    sessionId: string,
  ) {
    const refreshDays = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? 30,
    );

    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: `${refreshDays}d` as JwtSignOptions['expiresIn'],
      },
    );
  }

  private getRefreshTokenExpiresAt() {
    const refreshDays = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? 30,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    return expiresAt;
  }
  private sanitizeUser<T extends { passwordHash?: string }>(user: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
