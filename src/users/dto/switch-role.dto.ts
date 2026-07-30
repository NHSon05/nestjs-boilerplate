import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class SwitchRoleDto {
  @ApiProperty({
    description: 'Target role to switch to (TOURIST or GUIDE)',
    enum: UserRole,
    example: UserRole.GUIDE,
  })
  @IsEnum(UserRole, { message: 'Vai trò chuyển đổi không hợp lệ' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role: UserRole;
}
