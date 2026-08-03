import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// agora-token hiện dùng CommonJS.

import { RtcTokenBuilder, RtcRole } from 'agora-token';

export interface AgoraTokenResult {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
  expiresAt: Date;
}

@Injectable()
export class AgoraService {
  constructor(private readonly configService: ConfigService) {}

  generateRtcToken(params: {
    channelName: string;
    uid: number;
  }): AgoraTokenResult {
    const appId = this.configService.getOrThrow<string>('AGORA_APP_ID');

    const appCertificate = this.configService.getOrThrow<string>(
      'AGORA_APP_CERTIFICATE',
    );

    const expiresInSeconds = Number(
      this.configService.get<string>('AGORA_TOKEN_EXPIRES_IN_SECONDS') ?? 3600,
    );

    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new InternalServerErrorException(
        'AGORA_TOKEN_EXPIRES_IN_SECONDS không hợp lệ',
      );
    }

    /*
     * agora-token sử dụng số giây hiệu lực cho
     * token và privilege trong AccessToken2.
     */
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      params.channelName,
      params.uid,
      RtcRole.PUBLISHER,
      expiresInSeconds,
      expiresInSeconds,
    );

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return {
      appId,
      token,
      channelName: params.channelName,
      uid: params.uid,
      expiresAt,
    };
  }
}
