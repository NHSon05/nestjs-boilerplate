import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Chốt chặn bảo mật cực kì quan trọng trong NestJS dùng để xác thực và
// giải mã Access Token gửi lên từ client

// Nhiệm vụ chính
// Khi một client muốn truy cập vào các API cần đăng nhập
// Ví dụ: Lấy thông tin cá nhân, sửa thông tin, đặt lịch,... -> Phải gửi kèm accessToken
// --> jwt strategy đứng ra tiếp nhận,giải mã và xác thực chuỗi token này

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      // Tự động tìm và trích xuất chuỗi JWT nằm sua chữ Bearer trong header Authorization
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Kiểm tra hạn sử dụng của Token. Hết hạn -> chặn -> 401 Unauthorized
      ignoreExpiration: false,
      // Sử dụng mã bí mật của dự án để kiểm tra sign của token này xem token này
      // do server cấp hay là giả mạo
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Access token không hợp lệ');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
