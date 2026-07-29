import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateGuideProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Tiểu sử không được vượt quá 1000 ký tự' })
  bio?: string;

  @IsOptional()
  @IsInt({ message: 'Số năm kinh nghiệm phải là số nguyên' })
  @Min(0, { message: 'Số năm kinh nghiệm không được nhỏ hơn 0' })
  @Max(70, { message: 'Số năm kinh nghiệm không hợp lệ' })
  yearsExperience?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá thuê theo giờ phải là số' })
  @Min(0, { message: 'Giá thuê theo giờ không được nhỏ hơn 0' })
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tên thành phố không được vượt quá 100 ký tự' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tên quốc gia không được vượt quá 100 ký tự' })
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3, { message: 'Mã tiền tệ phải gồm 3 ký tự (ví dụ: VND, USD)' })
  currency?: string;
}
