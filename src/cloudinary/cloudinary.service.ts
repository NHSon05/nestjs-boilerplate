import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import 'multer';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as CloudinaryType,
  UploadApiOptions,
} from 'cloudinary';
import { CLOUDINARY } from './cloudinary.constants';
import { UploadedImage } from './interface/image-upload.interface';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY)
    private readonly cloudinary: typeof CloudinaryType,
  ) {}

  uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedImage> {
    if (!file || !file.buffer) {
      throw new BadRequestException(
        'File không hợp lệ hoặc thiếu dữ liệu buffer',
      );
    }
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: 'localism/avatars',
          public_id: userId,
          resource_type: 'image',

          overwrite: true,
          invalidate: true,

          transformation: [
            {
              width: 800,
              height: 800,
              crop: 'limit',
            },
            {
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(
              new BadGatewayException(
                error?.message ?? 'Không thể upload ảnh lên cloudinary',
              ),
            );
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await this.cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
    } catch {
      throw new BadGatewayException('Không thể xóa ảnh trên Cloudinary');
    }
  }
  uploadBuffer(
    file: Express.Multer.File,
    options: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        options,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(
              new BadGatewayException(
                error?.message ?? 'Không thể upload file lên Cloudinary',
              ),
            );
            return;
          }

          resolve(result);
        },
      );

      uploadStream.on('error', () => {
        reject(new BadGatewayException('Không thể đọc dữ liệu file upload'));
      });

      uploadStream.end(file.buffer);
    });
  }
  uploadChatFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return this.uploadBuffer(file, {
      folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
  }
  async deleteAsset(params: {
    publicId: string;
    resourceType?: 'image' | 'video' | 'raw';
  }): Promise<void> {
    try {
      const response = (await this.cloudinary.uploader.destroy(
        params.publicId,
        {
          resource_type: params.resourceType ?? 'image',
          invalidate: true,
        },
      )) as { result?: string };

      if (response.result !== 'ok' && response.result !== 'not found') {
        throw new Error(
          `Cloudinary delete result: ${response.result ?? 'unknown'}`,
        );
      }
    } catch {
      throw new BadGatewayException('Không thể xóa file trên Cloudinary');
    }
  }
}
