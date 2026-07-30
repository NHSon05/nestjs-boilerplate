import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Vietnam phone number (10 digits)',
    example: '0987654321',
  })
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Số điện thoại không đúng định dạng Việt Nam',
  })
  phone: string;

  @ApiProperty({
    description: 'Personal email address',
    example: 'johndoe@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'Password123@',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự',
  })
  @MaxLength(72, {
    message: 'Mật khẩu không được vượt quá 72 ký tự',
  })
  password: string;

  @ApiProperty({
    description: 'Confirm password matching password',
    example: 'Password123@',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lại mật khẩu' })
  confirmPassword: string;

  @ApiPropertyOptional({
    description: 'User account role (TOURIST or GUIDE)',
    enum: UserRole,
    default: UserRole.TOURIST,
    example: UserRole.TOURIST,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role?: UserRole;
}
