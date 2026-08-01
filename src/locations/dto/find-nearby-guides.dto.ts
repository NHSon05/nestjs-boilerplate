import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class FindNearbyGuidesDto {
  @ApiProperty({
    description: 'Vĩ độ điểm trung tâm tìm kiếm (Latitude)',
    example: 15.8801,
  })
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Kinh độ điểm trung tâm tìm kiếm (Longitude)',
    example: 108.338,
  })
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Bán kính tìm kiếm (km)',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radiusKm = 5;

  @ApiPropertyOptional({
    description: 'Số trang (Trang 1, 2, ...)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Số lượng HDV trên 1 trang',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    description:
      'Chỉ tìm kiếm những HDV đang bật trạng thái sẵn sàng (available)',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  availableOnly = true;
}
