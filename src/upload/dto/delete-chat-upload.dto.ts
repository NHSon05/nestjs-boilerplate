import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';

export class DeleteChatUploadDto {
  @ApiProperty({
    example: 'localism/chat/user-id/file-name',
  })
  @IsString()
  @MaxLength(500)
  publicId: string;

  @ApiProperty({
    enum: ['image', 'video', 'raw'],
    example: 'image',
  })
  @IsIn(['image', 'video', 'raw'])
  resourceType: 'image' | 'video' | 'raw';
}
