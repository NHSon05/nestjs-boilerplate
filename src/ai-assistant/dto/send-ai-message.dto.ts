import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendAiMessageDto {
  @ApiProperty({
    example: 'Hãy lên lịch trình khám phá Hội An trong một ngày.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}
