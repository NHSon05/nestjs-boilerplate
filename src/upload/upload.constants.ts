export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 20 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export const CHAT_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',

  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',

  'video/mp4',
  'video/webm',
] as const;
