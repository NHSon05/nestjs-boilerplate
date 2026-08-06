import { AttachmentType } from '@prisma/client';

export interface ChatUploadResult {
  type: AttachmentType;
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  format: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: Date;
}
