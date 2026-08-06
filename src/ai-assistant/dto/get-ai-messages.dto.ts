import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GetAiMessagesDto {
  @ApiPropertyOptional({
    type: Number,
    default: 30,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;

  @ApiPropertyOptional({
    description: 'Lấy các message trước message này',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
