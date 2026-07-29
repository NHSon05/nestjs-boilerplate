import { LanguageProficiency } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AddGuideLanguageDto {
  @IsString({ message: 'languageId phải là dạng chuỗi' })
  @IsNotEmpty({ message: 'languageId không được để trống' })
  languageId: string;

  @IsEnum(LanguageProficiency, { message: 'Trình độ ngôn ngữ không hợp lệ' })
  @IsNotEmpty({ message: 'Trình độ ngôn ngữ không được để trống' })
  proficiencyLevel: LanguageProficiency;
}

export class UpdateGuideLanguageDto {
  @IsEnum(LanguageProficiency, { message: 'Trình độ ngôn ngữ không hợp lệ' })
  @IsNotEmpty({ message: 'Trình độ ngôn ngữ không được để trống' })
  proficiencyLevel: LanguageProficiency;
}
