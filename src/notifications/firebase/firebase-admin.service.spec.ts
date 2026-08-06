import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FirebaseAdminService } from './firebase-admin.service';

describe('FirebaseAdminService', () => {
  let service: FirebaseAdminService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockReturnValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAdminService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FirebaseAdminService>(FirebaseAdminService);
  });

  it('Gửi Multicast Push ở chế độ Fallback khi không có credentials', async () => {
    const tokens = ['token-1', 'token-2'];
    const payload = {
      title: 'Thông báo mới',
      body: 'Bạn có 1 tin nhắn mới',
    };

    const result = await service.sendMulticastPush(tokens, payload);

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.failedTokens).toEqual([]);
  });

  it('Trả về kết quả rỗng khi mảng token rỗng', async () => {
    const result = await service.sendMulticastPush([], {
      title: 'Test',
      body: 'Test',
    });

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.failedTokens).toEqual([]);
  });
});
