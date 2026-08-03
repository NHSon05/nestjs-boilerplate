import { createHash } from 'crypto';

export function createAgoraUid(userId: string): number {
  const hash = createHash('sha256').update(userId).digest();

  /*
   * UInt32, tránh uid = 0 vì 0 thường được dùng cho
   * trường hợp Agora tự cấp UID.
   */
  const uid = hash.readUInt32BE(0);

  return uid === 0 ? 1 : uid;
}
