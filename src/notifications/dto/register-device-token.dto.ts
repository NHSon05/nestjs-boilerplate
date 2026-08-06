import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM Token thu thập được từ thiết bị người dùng',
    example: 'fcm_token_sample_string_123456789',
  })
  @IsString()
  @MaxLength(1000)
  token: string;

  @ApiPropertyOptional({
    description: 'Loại thiết bị: IOS, ANDROID, WEB',
    example: 'ANDROID',
  })
  @IsOptional()
  @IsString()
  @IsIn(['IOS', 'ANDROID', 'WEB'])
  deviceType?: string;
}
