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

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  sessionId?: string;
}

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

    const phone = dto.phone.trim();
    const email = dto.email.trim().toLowerCase();

    const existingPhone = await this.usersService.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? 12,
    );

    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      phone,
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
    const phone = dto.phone.trim();
    const user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new UnauthorizedException(
        'Số điện thoại hoặc mật khẩu không chính xác',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không thể đăng nhập');
    }
    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Số điện thoại hoặc mật khẩu không chính xác',
      );
    }
    const tokens = await this.createSessionAndTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (!payload.sessionId) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: {
        id: payload.sessionId,
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expriesAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }

    const refreshTokenMatched = await bcrypt.compare(
      refreshToken,
      session.tokenHash,
    );

    if (!refreshTokenMatched) {
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
        },
      });
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const newRefreshToken = await this.signRefreshToken(
      session.user,
      session.id,
    );

    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.refreshSession.update({
      where: {
        id: session.id,
      },
      data: {
        tokenHash: newTokenHash,
        expriesAt: this.getRefreshTokenExpiresAt(),
      },
    });
    const accessToken = await this.signAccessToken(session.user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      });
    } catch {
      return {
        message: 'Đăng xuất thành công',
      };
    }
    if (payload.sessionId) {
      await this.prisma.refreshSession.updateMany({
        where: {
          id: payload.sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }
    return {
      message: 'Đăng xuất thành công',
    };
  }

  // async me(userId: string) {
  //   const user = await this.usersService.findById(userId);

  //   if (!user) {
  //     throw new UnauthorizedException('Người dùng không tồn tại');
  //   }

  //   return this.sanitizeUser(user);
  // }

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

  private sanitizeUser<
    T extends {
      passwordHash?: string;
    },
  >(user: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
