import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAiConversationDto {
  @ApiPropertyOptional({
    example: 'Lên kế hoạch du lịch Hội An',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example:
      'Bạn là trợ lý du lịch của Localism. Trả lời rõ ràng, an toàn và thực tế.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  systemInstruction?: string;
}
