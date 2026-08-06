import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RemoveDeviceTokenDto {
  @ApiProperty({
    description: 'FCM Token cần xóa/hủy đăng ký',
    example: 'fcm_token_sample_string_123456789',
  })
  @IsString()
  @MaxLength(1000)
  token: string;
}
