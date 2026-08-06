import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: UploadsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-123',
    email: 'user@example.com',
    role: 'TOURIST' as any,
  };

  const mockUploadsService = {
    uploadChatFile: jest.fn(),
    deleteChatUpload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    service = module.get<UploadsService>(UploadsService);
  });

  describe('uploadChatFile', () => {
    it('gọi uploadsService.uploadChatFile với file hợp lệ', async () => {
      const mockFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 5000,
      } as Express.Multer.File;

      const expectedResult = {
        message: 'Upload file thành công',
        data: { url: 'https://cloudinary.com/test.png' },
      };

      mockUploadsService.uploadChatFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadChatFile(mockUser, mockFile);

      expect(service.uploadChatFile).toHaveBeenCalledWith(mockUser.id, mockFile);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteChatUpload', () => {
    it('gọi uploadsService.deleteChatUpload với đúng dto', async () => {
      const dto = {
        publicId: `localism/chat/${mockUser.id}/test`,
        resourceType: 'image' as const,
      };

      const expectedResult = {
        message: 'Đã xóa file upload',
        data: { publicId: dto.publicId },
      };

      mockUploadsService.deleteChatUpload.mockResolvedValue(expectedResult);

      const result = await controller.deleteChatUpload(mockUser, dto);

      expect(service.deleteChatUpload).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
