import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateMessageAttachmentDto } from './create-message-attachment.dto';

export class CreateMessageDto {
  @ApiProperty({
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({
    example: 'Xin chào, tôi đã nhận được lịch trình.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({
    description: 'UUID được tạo ở client để chống gửi trùng',
    example: 'cf782852-b682-4c52-82cc-e46535444648',
  })
  @IsUUID()
  clientMessageId: string;

  @ApiPropertyOptional({
    description: 'ID của message được trả lời',
  })
  @IsOptional()
  @IsUUID()
  replyToId?: string;

  @ApiPropertyOptional({
    type: [CreateMessageAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMessageAttachmentDto)
  attachments?: CreateMessageAttachmentDto[];
}
