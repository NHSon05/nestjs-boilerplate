import { ApiPropertyOptional } from '@nestjs/swagger';
import { AiConversationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetAiConversationsDto {
  @ApiPropertyOptional({
    enum: AiConversationStatus,
  })
  @IsOptional()
  @IsEnum(AiConversationStatus)
  status?: AiConversationStatus;

  @ApiPropertyOptional({
    type: Number,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
