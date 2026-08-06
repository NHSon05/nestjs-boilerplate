import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AttachmentType } from '@prisma/client';
import { UploadsService } from './uploads.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

describe('UploadsService', () => {
  let service: UploadsService;

  const mockCloudinaryService = {
    uploadChatFile: jest.fn(),
    deleteAsset: jest.fn(),
  };

  const currentUserId = 'user-uuid-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  describe('uploadChatFile', () => {
    it('Upload file ảnh hợp lệ thành công', async () => {
      const mockFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake-image-data'),
      } as Express.Multer.File;

      const mockCloudinaryResult = {
        public_id: `localism/chat/${currentUserId}/photo`,
        secure_url: 'https://cloudinary.com/photo.jpg',
        resource_type: 'image',
        bytes: 100000,
        format: 'jpg',
        width: 800,
        height: 600,
        duration: null,
        created_at: '2026-08-05T10:00:00Z',
      };

      mockCloudinaryService.uploadChatFile.mockResolvedValue(mockCloudinaryResult);

      const result = await service.uploadChatFile(currentUserId, mockFile);

      expect(result.message).toBe('Upload file thành công');
      expect(result.data.type).toBe(AttachmentType.IMAGE);
      expect(result.data.publicId).toBe(`localism/chat/${currentUserId}/photo`);
      expect(result.data.url).toBe('https://cloudinary.com/photo.jpg');
      expect(mockCloudinaryService.uploadChatFile).toHaveBeenCalledWith(
        mockFile,
        `localism/chat/${currentUserId}`,
      );
    });

    it('Ném BadRequestException khi thiếu file', async () => {
      await expect(
        service.uploadChatFile(currentUserId, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('Ném UnsupportedMediaTypeException khi định dạng file không được hỗ trợ', async () => {
      const mockFile = {
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload',
        size: 1000,
      } as Express.Multer.File;

      await expect(
        service.uploadChatFile(currentUserId, mockFile),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('Ném BadRequestException khi dung lượng file vượt quá giới hạn', async () => {
      const mockFile = {
        originalname: 'huge_photo.jpg',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB > MAX_IMAGE_SIZE (10MB)
      } as Express.Multer.File;

      await expect(
        service.uploadChatFile(currentUserId, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteChatUpload', () => {
    it('Xóa file upload thành công khi publicId hợp lệ và thuộc sở hữu của user', async () => {
      const dto = {
        publicId: `localism/chat/${currentUserId}/sample-photo`,
        resourceType: 'image' as const,
      };

      mockCloudinaryService.deleteAsset.mockResolvedValue({ result: 'ok' });

      const result = await service.deleteChatUpload(currentUserId, dto);

      expect(result.message).toBe('Đã xóa file upload');
      expect(result.data.publicId).toBe(dto.publicId);
      expect(mockCloudinaryService.deleteAsset).toHaveBeenCalledWith({
        publicId: dto.publicId,
        resourceType: 'image',
      });
    });

    it('Ném BadRequestException khi xóa file không thuộc sở hữu của user', async () => {
      const dto = {
        publicId: `localism/chat/other-user-uuid/sample-photo`,
        resourceType: 'image' as const,
      };

      await expect(
        service.deleteChatUpload(currentUserId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
