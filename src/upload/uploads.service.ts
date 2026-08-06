import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AttachmentType } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { DeleteChatUploadDto } from './dto/delete-chat-upload.dto';
import {
  CHAT_UPLOAD_MIME_TYPES,
  MAX_AUDIO_SIZE,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from './upload.constants';

@Injectable()
export class UploadsService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadChatFile(currentUserId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file cần upload');
    }

    if (
      !CHAT_UPLOAD_MIME_TYPES.includes(
        file.mimetype as (typeof CHAT_UPLOAD_MIME_TYPES)[number],
      )
    ) {
      throw new UnsupportedMediaTypeException(
        'Định dạng file không được hỗ trợ',
      );
    }

    const attachmentType = this.resolveAttachmentType(file.mimetype);

    this.validateFileSize(attachmentType, file.size);

    const folder = this.buildChatFolder(currentUserId);

    const uploaded = await this.cloudinaryService.uploadChatFile(file, folder);

    return {
      message: 'Upload file thành công',
      data: {
        type: attachmentType,
        url: uploaded.secure_url,
        secureUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: uploaded.bytes ?? file.size,
        format: uploaded.format ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        duration:
          typeof uploaded.duration === 'number'
            ? Math.round(uploaded.duration)
            : null,
        createdAt: new Date(uploaded.created_at ?? Date.now()),
      },
    };
  }

  async deleteChatUpload(currentUserId: string, dto: DeleteChatUploadDto) {
    this.assertUploadOwnership(currentUserId, dto.publicId);

    await this.cloudinaryService.deleteAsset({
      publicId: dto.publicId,
      resourceType: dto.resourceType,
    });

    return {
      message: 'Đã xóa file upload',
      data: {
        publicId: dto.publicId,
      },
    };
  }

  private resolveAttachmentType(mimeType: string): AttachmentType {
    if (mimeType.startsWith('image/')) {
      return AttachmentType.IMAGE;
    }

    if (mimeType.startsWith('audio/')) {
      return AttachmentType.AUDIO;
    }

    if (mimeType.startsWith('video/')) {
      return AttachmentType.VIDEO;
    }

    return AttachmentType.FILE;
  }

  private validateFileSize(type: AttachmentType, size: number): void {
    const maxSizeByType: Record<AttachmentType, number> = {
      [AttachmentType.IMAGE]: MAX_IMAGE_SIZE,
      [AttachmentType.FILE]: MAX_FILE_SIZE,
      [AttachmentType.AUDIO]: MAX_AUDIO_SIZE,
      [AttachmentType.VIDEO]: MAX_VIDEO_SIZE,
    };

    const maxSize = maxSizeByType[type];

    if (size > maxSize) {
      throw new BadRequestException(
        `File vượt quá giới hạn ${Math.floor(maxSize / 1024 / 1024)} MB`,
      );
    }
  }

  private buildChatFolder(currentUserId: string): string {
    return `localism/chat/${currentUserId}`;
  }

  private assertUploadOwnership(currentUserId: string, publicId: string): void {
    const expectedPrefix = `localism/chat/${currentUserId}/`;

    if (!publicId.startsWith(expectedPrefix)) {
      throw new BadRequestException('Bạn không có quyền xóa file này');
    }
  }
}
