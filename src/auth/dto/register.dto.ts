import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from 'generated/prisma';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @MinLength(8, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự',
  })
  @MaxLength(72, {
    message: 'Mật khẩu không được vượt quá 72 ký tự',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lại mật khẩu' })
  confirmPassword: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
