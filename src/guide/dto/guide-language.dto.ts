import { ApiProperty } from '@nestjs/swagger';
import { LanguageProficiency } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AddGuideLanguageDto {
  @ApiProperty({
    description: 'Target language ID from languages table (UUID)',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  @IsString({ message: 'languageId phải là dạng chuỗi' })
  @IsNotEmpty({ message: 'languageId không được để trống' })
  languageId: string;

  @ApiProperty({
    description: 'Proficiency level (BASIC, INTERMEDIATE, ADVANCED, NATIVE)',
    enum: LanguageProficiency,
    example: LanguageProficiency.ADVANCED,
  })
  @IsEnum(LanguageProficiency, { message: 'Trình độ ngôn ngữ không hợp lệ' })
  @IsNotEmpty({ message: 'Trình độ ngôn ngữ không được để trống' })
  proficiencyLevel: LanguageProficiency;
}

export class UpdateGuideLanguageDto {
  @ApiProperty({
    description: 'Proficiency level (BASIC, INTERMEDIATE, ADVANCED, NATIVE)',
    enum: LanguageProficiency,
    example: LanguageProficiency.NATIVE,
  })
  @IsEnum(LanguageProficiency, { message: 'Trình độ ngôn ngữ không hợp lệ' })
  @IsNotEmpty({ message: 'Trình độ ngôn ngữ không được để trống' })
  proficiencyLevel: LanguageProficiency;
}
