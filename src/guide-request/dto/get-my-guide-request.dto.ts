import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { GuideRequestStatus } from '@prisma/client';

export class GetMyGuideRequestsDto {
  @ApiPropertyOptional({
    description:
      'Lọc danh sách theo trạng thái (PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED, EXPIRED)',
    enum: GuideRequestStatus,
    example: GuideRequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(GuideRequestStatus)
  status?: GuideRequestStatus;

  @ApiPropertyOptional({
    description: 'Số trang (Trang 1, 2, ...)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Số lượng item trên 1 trang',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
