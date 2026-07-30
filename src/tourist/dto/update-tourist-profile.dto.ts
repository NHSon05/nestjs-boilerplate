import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTouristProfileDto {
  @ApiPropertyOptional({
    description: 'Nationality or Country code (ISO 3166-1 alpha-2)',
    example: 'VN',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Quốc tịch không được vượt quá 100 ký tự' })
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Preferred language code (ISO 639-1)',
    example: 'vi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Mã ngôn ngữ không được vượt quá 10 ký tự' })
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'List of tourist interests and hobbies',
    example: ['Food', 'Photography', 'Camping'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Sở thích phải là một danh sách' })
  @IsString({ each: true, message: 'Mỗi sở thích phải là chuỗi' })
  interests?: string[];

  @ApiPropertyOptional({
    description: 'Travel preferences JSON object',
    example: { budget: 'medium', pace: 'relaxed' },
  })
  @IsOptional()
  @IsObject({ message: 'Tùy chọn du lịch phải là một object' })
  travelPreferences?: Record<string, any>;
}
