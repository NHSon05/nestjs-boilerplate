import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  fullName?: string;

  @IsOptional()
  gender?: Gender;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày sinh không đúng định dạng ngày (YYYY-MM-DD)' },
  )
  dateOfBirth?: string;
}
