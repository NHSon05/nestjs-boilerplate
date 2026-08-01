import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelGuideRequestDto {
  @ApiPropertyOptional({
    description: 'Lý do hủy yêu cầu hướng dẫn',
    example: 'Thay đổi kế hoạch di chuyển nên không cần HDV nữa.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
