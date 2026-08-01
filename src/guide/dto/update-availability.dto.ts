import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Trạng thái sẵn sàng nhận tour của hướng dẫn viên',
    example: true,
  })
  @IsBoolean()
  isAvailable: boolean;
}
