import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, GeminiProvider],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
