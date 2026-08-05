import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class GetMessagesDto {
  @ApiPropertyOptional({
    type: Number,
    default: 30,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;

  @ApiPropertyOptional({
    description: 'Lấy message trước message có ID này',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Lấy message trước thời điểm này',
    example: '2026-08-05T07:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  before?: string;
}
