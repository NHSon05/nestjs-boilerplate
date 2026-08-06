import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AiConversationStatus,
  AiMessageRole,
  AiProvider,
  Prisma,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { CreateAiConversationDto } from './dto/create-ai-conversation.dto';
import { GetAiConversationsDto } from './dto/get-ai-conversations.dto';
import { GetAiMessagesDto } from './dto/get-ai-messages.dto';
import { SendAiMessageDto } from './dto/send-ai-message.dto';
import { UpdateAiConversationDto } from './dto/update-ai-conversation.dto';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class AiAssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly geminiProvider: GeminiProvider,
  ) {}

  async createConversation(userId: string, dto: CreateAiConversationDto) {
    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    const conversation = await this.prisma.aiConversation.create({
      data: {
        userId,
        title: dto.title?.trim() || null,
        systemInstruction:
          dto.systemInstruction?.trim() || this.getDefaultSystemInstruction(),
        provider: AiProvider.GEMINI,
        model,
      },
      select: this.conversationSelect(),
    });

    return {
      message: 'Đã tạo cuộc trò chuyện AI',
      data: conversation,
    };
  }

  async findAll(userId: string, query: GetAiConversationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AiConversationWhereInput = {
      userId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.aiConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            lastMessageAt: {
              sort: 'desc',
              nulls: 'last',
            },
          },
          {
            updatedAt: 'desc',
          },
        ],
        select: {
          ...this.conversationSelect(),
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      }),

      this.prisma.aiConversation.count({
        where,
      }),
    ]);

    return {
      data: conversations.map(({ messages, ...conversation }) => ({
        ...conversation,
        lastMessage: messages[0] ?? null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, conversationId: string) {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );

    return {
      data: conversation,
    };
  }

  async getMessages(
    userId: string,
    conversationId: string,
    query: GetAiMessagesDto,
  ) {
    await this.getOwnedConversation(userId, conversationId);

    const limit = query.limit ?? 30;

    const messages = await this.prisma.aiMessage.findMany({
      where: {
        conversationId,
      },
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      select: this.messageSelect(),
    });

    const hasMore = messages.length > limit;
    const pageItems = hasMore ? messages.slice(0, limit) : messages;

    const nextCursor = pageItems.at(-1)?.id ?? null;

    return {
      data: pageItems.reverse(),
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    dto: SendAiMessageDto,
  ) {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );

    if (conversation.status !== AiConversationStatus.ACTIVE) {
      throw new ConflictException('Cuộc trò chuyện AI không còn hoạt động');
    }

    const prompt = dto.content.trim();

    const maxHistory = Number(
      this.configService.get<string>('AI_MAX_HISTORY_MESSAGES') ?? 20,
    );

    const recentMessages = await this.prisma.aiMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: maxHistory,
      select: {
        role: true,
        content: true,
      },
    });

    const history = recentMessages
      .reverse()
      .filter(
        (message) =>
          message.role === AiMessageRole.USER ||
          message.role === AiMessageRole.ASSISTANT,
      )
      .map((message) => ({
        role:
          message.role === AiMessageRole.USER
            ? ('user' as const)
            : ('model' as const),
        content: message.content,
      }));

    /*
     * Lưu USER message trước khi gọi provider.
     * Nếu Gemini lỗi, vẫn giữ được prompt để retry.
     */
    const userMessage = await this.prisma.aiMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.USER,
        content: prompt,
      },
      select: this.messageSelect(),
    });

    try {
      const aiResult = await this.geminiProvider.generateResponse({
        model: conversation.model || 'GEMINI',
        prompt,
        systemInstruction: conversation.systemInstruction ?? undefined,
        history,
      });

      const result = await this.prisma.$transaction(async (tx) => {
        const assistantMessage = await tx.aiMessage.create({
          data: {
            conversationId,
            role: AiMessageRole.ASSISTANT,
            content: aiResult.content,
            model: aiResult.model,
            promptTokens: aiResult.promptTokens,
            completionTokens: aiResult.completionTokens,
            totalTokens: aiResult.totalTokens,
            finishReason: aiResult.finishReason,
            metadata: aiResult.metadata as Prisma.InputJsonValue | undefined,
          },
          select: this.messageSelect(),
        });

        const generatedTitle = conversation.title
          ? undefined
          : this.createTitle(prompt);

        await tx.aiConversation.update({
          where: {
            id: conversationId,
          },
          data: {
            lastMessageAt: new Date(),
            ...(generatedTitle
              ? {
                  title: generatedTitle,
                }
              : {}),
          },
        });

        return assistantMessage;
      });

      return {
        message: 'AI đã trả lời',
        data: {
          userMessage,
          assistantMessage: result,
        },
      };
    } catch (error) {
      /*
       * Đánh dấu lỗi vào metadata của USER message
       * để frontend có thể hiển thị nút Retry.
       */
      await this.prisma.aiMessage.update({
        where: {
          id: userMessage.id,
        },
        data: {
          metadata: {
            generationFailed: true,
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    dto: UpdateAiConversationDto,
  ) {
    await this.getOwnedConversation(userId, conversationId);

    const conversation = await this.prisma.aiConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        ...(dto.title !== undefined
          ? {
              title: dto.title.trim() || null,
            }
          : {}),
        ...(dto.status
          ? {
              status: dto.status,
            }
          : {}),
      },
      select: this.conversationSelect(),
    });

    return {
      message: 'Cập nhật cuộc trò chuyện AI thành công',
      data: conversation,
    };
  }

  async removeConversation(userId: string, conversationId: string) {
    await this.getOwnedConversation(userId, conversationId);

    const deletedAt = new Date();

    await this.prisma.aiConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        status: AiConversationStatus.DELETED,
        deletedAt,
      },
    });

    return {
      message: 'Đã xóa cuộc trò chuyện AI',
      data: {
        id: conversationId,
        deletedAt,
      },
    };
  }

  private async getOwnedConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        ...this.conversationSelect(),
        systemInstruction: true,
      },
    });

    if (!conversation || conversation.deletedAt) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện AI');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập cuộc trò chuyện này',
      );
    }

    return conversation;
  }

  private createTitle(prompt: string): string {
    const normalized = prompt.replace(/\s+/g, ' ').trim();

    return normalized.length <= 60
      ? normalized
      : `${normalized.slice(0, 57)}...`;
  }

  private getDefaultSystemInstruction(): string {
    return [
      'Bạn là trợ lý du lịch của ứng dụng Localism.',
      'Hãy trả lời rõ ràng, thực tế và thân thiện.',
      'Không bịa đặt thông tin địa điểm, giá cả hoặc lịch hoạt động.',
      'Khi không chắc chắn, hãy nói rõ mức độ không chắc chắn.',
      'Không yêu cầu hoặc tiết lộ dữ liệu cá nhân nhạy cảm.',
      'Ưu tiên trải nghiệm địa phương an toàn và tôn trọng văn hóa.',
    ].join(' ');
  }

  private conversationSelect() {
    return {
      id: true,
      userId: true,
      title: true,
      status: true,
      provider: true,
      model: true,
      lastMessageAt: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.AiConversationSelect;
  }

  private messageSelect() {
    return {
      id: true,
      conversationId: true,
      role: true,
      content: true,
      model: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      finishReason: true,
      metadata: true,
      createdAt: true,
    } satisfies Prisma.AiMessageSelect;
  }
}
