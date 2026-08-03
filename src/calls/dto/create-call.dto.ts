import { ApiProperty } from '@nestjs/swagger';
import { CallType } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class CreateCallDto {
  @ApiProperty({
    description: 'Loại cuộc gọi (AUDIO hoặc VIDEO)',
    enum: CallType,
    example: CallType.VIDEO,
  })
  @IsEnum(CallType, {
    message: 'Loại cuộc gọi không hợp lệ (phải là AUDIO hoặc VIDEO)',
  })
  @IsNotEmpty({ message: 'Loại cuộc gọi không được để trống' })
  type: CallType;
}
