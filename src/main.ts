// Dùng để tạo instance của ứng dụng Nestjs từ module gốc
import { NestFactory } from '@nestjs/core';
// Module gốc của ứng dụng
import { AppModule } from './app.module';
// các utility từ @nestjs/common dùng để validate dữ liệu đầu vào và định nghĩa kiểu phân loại version cho API
import { ValidationPipe, VersioningType } from '@nestjs/common';
// middleware bảo mật giúp thiết lập HTTP headers phù hợp để bảo vệ ứng dụng
// khỏi lỗ hỏng bảo mật
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  /**
   * Cấu hình ứng dụng
   * Khởi tạo instance của NestJS bằng cách truyền vào AppModule
   */
  const app = await NestFactory.create(AppModule);

  /**
   * Thiết lập tiền tố chung cho các routes.
   * Thay vì /users, endpoint sẽ là /api/users
   */
  app.setGlobalPrefix('api');

  /**
   * Cấu hình versioning (Phân bản API)
   * Kích hoạt tính năng chia phiên bản API theo đường dẫn URI
   * Với cấu hình trên, endpoint mặc định có tiền tố /v1 sau prefix.
   * Ví dụ: /api/v1/users
   */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  /** Cấu hình CORS
   * Cho phép frontend chạy ở cổng 3000 và 5173
   * credentials: true -> Cho phép gửi kèm cookies hoặc headers xác thực từ FE lên BE
   */
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.CLIENT_URL || '',
    ].filter(Boolean),
    credentials: true,
  });

  /* Cấu hình bảo mệt với Helmet
    Sử dụng middleware helmet để thiết lập HTTP header liên quan đến bảo mật
    XSS filter, content security policy, ngăn chặn clickjacking
  */
  app.use(helmet());

  /** Cấu hình validation toàn cục
   * Áp dụng pipeline kiểm tra tính hợp lệ dữ liệu gửi lên (DTO) cho toàn bộ hệ thống
   */
  app.useGlobalPipes(
    new ValidationPipe({
      // Tự động lạoi bỏ các thuộc tính không được định nghĩa trong DTO
      whitelist: true,
      // Nếu client gửi lên các thuộc tính không có trong DTO, server sẽ chặn lại và báo lỗi (400 Bad Request).
      forbidNonWhitelisted: true,
      // Tự động chuyển đổi kiểu dữ liệu của payload nhận được sang kiểu dữ liệu đã khai báo trong DTO
      // chuyển string "123" thành number 123
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Localism API')
    .setDescription('API for connecting tourists with local guides')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
