import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FirebaseAdminSDK,
  MulticastPushResult,
  PushNotificationPayload,
} from './interfaces/firebase-admin.interface';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: unknown = null;

  constructor(private readonly configService: ConfigService) {
    this.initFirebase();
  }

  private initFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.log(
        'Firebase Admin SDK: Credentials chưa được cấu hình. Push Notifications sẽ hoạt động ở chế độ Fallback/Mock.',
      );
      return;
    }

    try {
      // Dynamic import to support graceful fallback if firebase-admin package is optional
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin') as unknown as FirebaseAdminSDK;

      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('Firebase Admin SDK đã được khởi tạo thành công 🔥');
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      this.logger.warn(
        `Không thể khởi tạo Firebase Admin SDK: ${(error as Error).message}`,
      );
    }
  }

  async sendMulticastPush(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<MulticastPushResult> {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    if (!this.firebaseApp) {
      this.logger.debug(
        `[Fallback Mode] Push Notification tới ${tokens.length} thiết bị: "${payload.title}" - ${payload.body}`,
      );
      return {
        successCount: tokens.length,
        failureCount: 0,
        failedTokens: [],
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = require('firebase-admin') as unknown as FirebaseAdminSDK;
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data
          ? Object.fromEntries(
              Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          this.logger.warn(
            `FCM send error for token ${tokens[idx]}: ${resp.error?.message ?? ''}`,
          );
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi gửi Multicast Push Notification: ${(error as Error).message}`,
      );
      return {
        successCount: 0,
        failureCount: tokens.length,
        failedTokens: tokens,
      };
    }
  }
}
