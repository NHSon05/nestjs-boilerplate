import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CallStatus, ConversationStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';
import { GetCallHistoryDto } from './dto/get-call-history.dto';
import { CallsGateway } from './calls.gateway';
import { AgoraService } from 'src/agora/agora.service';
import { randomUUID } from 'crypto';
import { createAgoraUid } from 'src/agora/agora-uid.util';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly callsGateway: CallsGateway,
    private readonly agoraService: AgoraService,
  ) {}

  async createCall(
    callerId: string,
    conversationId: string,
    dto: CreateCallDto,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        status: true,
        members: {
          where: {
            leftAt: null,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new ConflictException('Cuộc trò chuyện đã đóng');
    }

    const memberIds = conversation.members.map((member) => member.userId);

    if (!memberIds.includes(callerId)) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const receiverId = memberIds.find((memberId) => memberId !== callerId);

    if (!receiverId) {
      throw new BadRequestException('Không tìm thấy người nhận cuộc gọi');
    }

    const activeCall = await this.prisma.callRecord.findFirst({
      where: {
        conversationId,
        status: {
          in: [CallStatus.RINGING, CallStatus.ACCEPTED],
        },
      },
      select: {
        id: true,
      },
    });

    if (activeCall) {
      throw new ConflictException('Cuộc trò chuyện đang có cuộc gọi khác');
    }

    const channelName = `call_${randomUUID().replaceAll('-', '')}`;

    const callerAgoraUid = createAgoraUid(callerId);

    const callerAgora = this.agoraService.generateRtcToken({
      channelName,
      uid: callerAgoraUid,
    });

    const call = await this.prisma.callRecord.create({
      data: {
        conversationId,
        callerId,
        receiverId,
        type: dto.type,
        status: CallStatus.RINGING,

        provider: 'AGORA',
        channelName,
      },

      select: {
        id: true,
        conversationId: true,
        callerId: true,
        receiverId: true,
        type: true,
        status: true,
        provider: true,
        channelName: true,
        ringingAt: true,
        createdAt: true,

        caller: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },

        receiver: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.callsGateway.emitIncomingCall(receiverId, {
      callId: call.id,
      conversationId: call.conversationId,
      type: call.type,
      status: call.status,
      channelName: call.channelName,
      caller: call.caller,
      ringingAt: call.ringingAt,
    });

    return {
      message: 'Đã bắt đầu cuộc gọi',
      data: {
        call,
        agora: callerAgora,
      },
    };
  }

  async acceptCall(receiverId: string, callId: string) {
    const call = await this.getCallOrThrow(callId);

    if (call.receiverId !== receiverId) {
      throw new ForbiddenException('Bạn không phải người nhận cuộc gọi');
    }

    const result = await this.prisma.callRecord.updateMany({
      where: {
        id: callId,
        receiverId,
        status: CallStatus.RINGING,
      },
      data: {
        status: CallStatus.ACCEPTED,
        acceptedAt: new Date(),
        startedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Cuộc gọi không còn ở trạng thái đổ chuông');
    }

    const updatedCall = await this.prisma.callRecord.findUnique({
      where: {
        id: callId,
      },
      select: {
        id: true,
        callerId: true,
        receiverId: true,
        conversationId: true,
        channelName: true,
        type: true,
        status: true,
        acceptedAt: true,
      },
    });

    if (!updatedCall) {
      throw new NotFoundException('Không tìm thấy cuộc gọi');
    }

    const receiverAgoraUid = createAgoraUid(receiverId);

    const receiverAgora = this.agoraService.generateRtcToken({
      channelName: updatedCall.channelName,
      uid: receiverAgoraUid,
    });

    this.callsGateway.emitCallAccepted(
      updatedCall.callerId,
      updatedCall.receiverId,
      {
        callId: updatedCall.id,
        conversationId: updatedCall.conversationId,
        type: updatedCall.type,
        status: updatedCall.status,
        channelName: updatedCall.channelName,
        acceptedAt: updatedCall.acceptedAt,
      },
    );

    return {
      message: 'Đã chấp nhận cuộc gọi',
      data: {
        call: updatedCall,
        agora: receiverAgora,
      },
    };
  }

  async rejectCall(receiverId: string, callId: string) {
    const call = await this.getCallOrThrow(callId);

    if (call.receiverId !== receiverId) {
      throw new ForbiddenException('Bạn không phải người nhận cuộc gọi');
    }

    const result = await this.prisma.callRecord.updateMany({
      where: {
        id: callId,
        receiverId,
        status: CallStatus.RINGING,
      },
      data: {
        status: CallStatus.REJECTED,
        rejectedAt: new Date(),
        endedAt: new Date(),
        durationSecs: 0,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Cuộc gọi không thể bị từ chối');
    }

    this.callsGateway.emitCallRejected(call.callerId, {
      callId,
      status: CallStatus.REJECTED,
    });

    return {
      message: 'Đã từ chối cuộc gọi',
      data: {
        callId,
        status: CallStatus.REJECTED,
      },
    };
  }

  async cancelCall(callerId: string, callId: string) {
    const call = await this.getCallOrThrow(callId);

    if (call.callerId !== callerId) {
      throw new ForbiddenException('Chỉ người gọi mới được hủy cuộc gọi');
    }

    const result = await this.prisma.callRecord.updateMany({
      where: {
        id: callId,
        callerId,
        status: CallStatus.RINGING,
      },
      data: {
        status: CallStatus.CANCELLED,
        cancelledAt: new Date(),
        endedAt: new Date(),
        durationSecs: 0,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Cuộc gọi không thể bị hủy');
    }

    this.callsGateway.emitCallCancelled(call.receiverId, {
      callId,
      status: CallStatus.CANCELLED,
    });

    return {
      message: 'Đã hủy cuộc gọi',
      data: {
        callId,
        status: CallStatus.CANCELLED,
      },
    };
  }

  async endCall(currentUserId: string, callId: string) {
    const call = await this.getCallOrThrow(callId);

    const isParticipant =
      call.callerId === currentUserId || call.receiverId === currentUserId;

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không thuộc cuộc gọi này');
    }

    if (call.status !== CallStatus.ACCEPTED) {
      throw new ConflictException(
        'Chỉ cuộc gọi đã được chấp nhận mới có thể kết thúc',
      );
    }

    const endedAt = new Date();

    const startedAt = call.startedAt ?? call.acceptedAt ?? call.createdAt;

    const durationSecs = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    const result = await this.prisma.callRecord.updateMany({
      where: {
        id: callId,
        status: CallStatus.ACCEPTED,
      },
      data: {
        status: CallStatus.ENDED,
        endedAt,
        durationSecs,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Cuộc gọi đã được kết thúc trước đó');
    }

    this.callsGateway.emitCallEnded(call.callerId, call.receiverId, {
      callId,
      status: CallStatus.ENDED,
      endedAt,
      durationSecs,
    });

    return {
      message: 'Cuộc gọi đã kết thúc',
      data: {
        callId,
        status: CallStatus.ENDED,
        endedAt,
        durationSecs,
      },
    };
  }

  async markAsMissed(callId: string) {
    const result = await this.prisma.callRecord.updateMany({
      where: {
        id: callId,
        status: CallStatus.RINGING,
      },
      data: {
        status: CallStatus.MISSED,
        endedAt: new Date(),
        durationSecs: 0,
      },
    });

    return result.count > 0;
  }

  async markAsFailed(callId: string, reason?: string) {
    const result = await this.prisma.callRecord.updateMany({
      where: {
        id: callId,
        status: {
          in: [CallStatus.RINGING, CallStatus.ACCEPTED],
        },
      },
      data: {
        status: CallStatus.FAILED,
        failureReason: reason?.trim(),
        endedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async getConversationCalls(
    currentUserId: string,
    conversationId: string,
    query: GetCallHistoryDto,
  ) {
    await this.assertConversationMember(currentUserId, conversationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CallRecordWhereInput = {
      conversationId,
    };

    const [calls, total] = await Promise.all([
      this.prisma.callRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          status: true,
          ringingAt: true,
          acceptedAt: true,
          startedAt: true,
          endedAt: true,
          durationSecs: true,
          createdAt: true,

          caller: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },

          receiver: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      }),

      this.prisma.callRecord.count({
        where,
      }),
    ]);

    return {
      data: calls,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getCallOrThrow(callId: string) {
    const call = await this.prisma.callRecord.findUnique({
      where: {
        id: callId,
      },
    });

    if (!call) {
      throw new NotFoundException('Không tìm thấy cuộc gọi');
    }

    return call;
  }

  private async assertConversationMember(
    userId: string,
    conversationId: string,
  ) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: {
        conversationId: true,
        leftAt: true,
      },
    });

    if (!member || member.leftAt) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }
  }
  async getAgoraToken(currentUserId: string, callId: string) {
    const call = await this.prisma.callRecord.findUnique({
      where: {
        id: callId,
      },
      select: {
        id: true,
        callerId: true,
        receiverId: true,
        channelName: true,
        status: true,
      },
    });

    if (!call) {
      throw new NotFoundException('Không tìm thấy cuộc gọi');
    }

    const isParticipant =
      call.callerId === currentUserId || call.receiverId === currentUserId;

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không thuộc cuộc gọi này');
    }

    // if (![CallStatus.RINGING, CallStatus.ACCEPTED].includes(call.status)) {
    //   throw new ConflictException('Cuộc gọi không còn hoạt động');
    // }

    const agoraUid = createAgoraUid(currentUserId);

    const agora = this.agoraService.generateRtcToken({
      channelName: call.channelName,
      uid: agoraUid,
    });

    return {
      data: agora,
    };
  }
}
