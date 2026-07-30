import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User display full name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Date of birth in YYYY-MM-DD format',
    example: '1998-05-20',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày sinh không đúng định dạng ngày (YYYY-MM-DD)' },
  )
  dateOfBirth?: string;
}
