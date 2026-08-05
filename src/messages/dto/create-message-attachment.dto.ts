import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMessageAttachmentDto {
  @ApiProperty({
    enum: AttachmentType,
    example: AttachmentType.IMAGE,
  })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/chat.jpg',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    example: 'localism/chat/abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  publicId?: string;

  @ApiPropertyOptional({
    example: 'hoi-an.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({
    example: 'image/jpeg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({
    example: 245000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  @ApiPropertyOptional({
    example: 1080,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({
    example: 1350,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({
    description: 'Thời lượng tính bằng giây',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  duration?: number;
}
