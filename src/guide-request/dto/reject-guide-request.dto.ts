import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectGuideRequestDto {
  @ApiProperty({
    description: 'Lý do từ chối yêu cầu hướng dẫn',
    example: 'Tôi đã có lịch dẫn đoàn khác vào thời gian này.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
