import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTouristProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Quốc tịch không được vượt quá 100 ký tự' })
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Mã ngôn ngữ không được vượt quá 10 ký tự' })
  preferredLanguage?: string;

  @IsOptional()
  @IsArray({ message: 'Sở thích phải là một danh sách' })
  @IsString({ each: true, message: 'Mỗi sở thích phải là chuỗi' })
  interests?: string[];

  @IsOptional()
  @IsObject({ message: 'Tùy chọn du lịch phải là một object' })
  travelPreferences?: Record<string, any>;
}
