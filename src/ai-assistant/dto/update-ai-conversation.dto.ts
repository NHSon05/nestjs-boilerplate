import { ApiPropertyOptional } from '@nestjs/swagger';
import { AiConversationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAiConversationDto {
  @ApiPropertyOptional({
    example: 'Lịch trình Hội An',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    enum: AiConversationStatus,
  })
  @IsOptional()
  @IsEnum(AiConversationStatus)
  status?: AiConversationStatus;
}
