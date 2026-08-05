import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({
    example: 'Nội dung đã được chỉnh sửa',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
