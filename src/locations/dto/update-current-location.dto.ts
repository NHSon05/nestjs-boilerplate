import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateCurrentLocationDto {
  @ApiProperty({
    description: 'Vĩ độ (Latitude) theo chuẩn WGS84',
    example: 15.8801,
  })
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Kinh độ (Longitude) theo chuẩn WGS84',
    example: 108.338,
  })
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({
    description: 'Bán kính độ chính xác GPS tính bằng mét',
    example: 12.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracy?: number;
}
