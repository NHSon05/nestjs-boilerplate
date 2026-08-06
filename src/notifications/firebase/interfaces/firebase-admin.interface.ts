export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface MulticastPushResult {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
}

export interface FirebaseSendResponse {
  success: boolean;
  error?: {
    message?: string;
  };
}

export interface FirebaseBatchResponse {
  responses: FirebaseSendResponse[];
  successCount: number;
  failureCount: number;
}

export interface FirebaseMessaging {
  sendEachForMulticast(
    message: Record<string, unknown>,
  ): Promise<FirebaseBatchResponse>;
}

export interface FirebaseAdminSDK {
  apps: unknown[];
  initializeApp(options: { credential: unknown }): unknown;
  app(): unknown;
  credential: {
    cert(config: {
      projectId: string;
      clientEmail: string;
      privateKey: string;
    }): unknown;
  };
  messaging(): FirebaseMessaging;
}
