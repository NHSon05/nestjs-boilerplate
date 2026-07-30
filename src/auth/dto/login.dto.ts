import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User registered phone number',
    example: '0987654321',
  })
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiProperty({
    description: 'Account password',
    example: 'Password123@',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @MinLength(8, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự',
  })
  @MaxLength(72)
  password: string;
}
