import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TouristsModule } from './tourist/tourists.module';
import { GuidesModule } from './guide/guides.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { LocationsModule } from './locations/locations.module';
import { GuideRequestsModule } from './guide-request/guide-requests.module';
import { CallsModule } from './calls/calls.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './upload/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        CLIENT_URL: Joi.string().uri().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
        BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        AGORA_APP_ID: Joi.string().required(),
        AGORA_APP_CERTIFICATE: Joi.string().required(),
        AGORA_TOKEN_EXPIRES_IN_SECONDS: Joi.number()
          .integer()
          .positive()
          .default(7200),
        GEMINI_API_KEY: Joi.string().required(),
        GEMINI_MODEL: Joi.string().required(),
        AI_MAX_HISTORY_MESSAGES: Joi.number()
          .integer()
          .min(1)
          .max(100)
          .default(20),
        AI_MAX_PROMPT_LENGTH: Joi.number().integer().min(100).default(10000),
        REDIS_URL: Joi.string().uri().optional(),
      }),
    }),
    DatabaseModule,
    CloudinaryModule,
    UsersModule,
    TouristsModule,
    GuidesModule,
    LocationsModule,
    AuthModule,
    GuideRequestsModule,
    CallsModule,
    ConversationsModule,
    MessagesModule,
    UploadsModule,
    NotificationsModule,
    AiAssistantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
