import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  AiProviderClient,
  GenerateAiResponseParams,
  GenerateAiResponseResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProviderClient {
  private readonly client: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');

    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  async generateResponse(
    params: GenerateAiResponseParams,
  ): Promise<GenerateAiResponseResult> {
    try {
      const contents = [
        ...(params.history ?? []).map((message) => ({
          role: message.role,
          parts: [
            {
              text: message.content,
            },
          ],
        })),
        {
          role: 'user' as const,
          parts: [
            {
              text: params.prompt,
            },
          ],
        },
      ];

      const response = await this.client.models.generateContent({
        model: params.model,
        contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      const content = response.text?.trim();

      if (!content) {
        throw new BadGatewayException('AI không trả về nội dung');
      }

      const usage = response.usageMetadata;

      return {
        content,
        model: params.model,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
        finishReason: response.candidates?.[0]?.finishReason,
        metadata: {
          cachedContentTokenCount: usage?.cachedContentTokenCount,
          thoughtsTokenCount: usage?.thoughtsTokenCount,
        },
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        throw new InternalServerErrorException('Gemini API chưa được cấu hình');
      }

      // throw new BadGatewayException('Không thể kết nối với Gemini AI');
      console.error('Gemini Error:', error);

      if (error instanceof Error) {
        console.error(error.message);
        console.error(error.stack);
      }

      throw error;
    }
  }
}
