import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGuideRequestDto {
  @ApiProperty({
    description: 'UUID của hướng dẫn viên muốn gửi yêu cầu',
    example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  })
  @IsUUID()
  guideId: string;

  @ApiProperty({
    description: 'Tiêu đề của chuyến đi hoặc yêu cầu hướng dẫn',
    example: 'Chuyến tham quan Phố cổ Hội An 1 ngày',
  })
  @IsString()
  @Length(3, 150)
  title: string;

  @ApiPropertyOptional({
    description:
      'Mô tả chi tiết nhu cầu, lịch trình mong muốn hoặc thông tin cần lưu ý',
    example:
      'Đoàn gồm 4 người lớn, cần HDV am hiểu lịch sử và ẩm thực địa phương.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Thời gian bắt đầu (định dạng ISO 8601)',
    example: '2026-08-10T08:00:00.000Z',
  })
  @IsDateString()
  startAt: string;

  @ApiProperty({
    description: 'Thời gian kết thúc (định dạng ISO 8601)',
    example: '2026-08-10T17:00:00.000Z',
  })
  @IsDateString()
  endAt: string;

  @ApiPropertyOptional({
    description: 'Địa điểm hẹn gặp mặt',
    example: '123 Trần Phú, Minh An, Hội An, Quảng Nam',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingAddress?: string;

  @ApiPropertyOptional({
    description: 'Vĩ độ điểm hẹn gặp mặt (Latitude)',
    example: 15.8777,
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  meetingLatitude?: number;

  @ApiPropertyOptional({
    description: 'Kinh độ điểm hẹn gặp mặt (Longitude)',
    example: 108.3275,
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  meetingLongitude?: number;

  @ApiPropertyOptional({
    description: 'Mức giá đề xuất cho tour (VND)',
    example: 1500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  proposedPrice?: number;

  @ApiPropertyOptional({
    description: 'Mã tiền tệ (ISO 4217, 3 ký tự)',
    example: 'VND',
    default: 'VND',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
