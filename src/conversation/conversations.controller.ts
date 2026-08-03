import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CallsService } from 'src/calls/calls.service';
import { CreateCallDto } from 'src/calls/dto/create-call.dto';
import { GetCallHistoryDto } from 'src/calls/dto/get-call-history.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('conversations/:conversationId/calls')
  createCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Body() dto: CreateCallDto,
  ) {
    return this.callsService.createCall(user.id, conversationId, dto);
  }

  @Get('conversations/:conversationId/calls')
  getConversationCalls(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Query() query: GetCallHistoryDto,
  ) {
    return this.callsService.getConversationCalls(
      user.id,
      conversationId,
      query,
    );
  }

  @Patch('calls/:callId/accept')
  acceptCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe)
    callId: string,
  ) {
    return this.callsService.acceptCall(user.id, callId);
  }

  @Patch('calls/:callId/reject')
  rejectCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe)
    callId: string,
  ) {
    return this.callsService.rejectCall(user.id, callId);
  }

  @Patch('calls/:callId/cancel')
  cancelCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe)
    callId: string,
  ) {
    return this.callsService.cancelCall(user.id, callId);
  }

  @Patch('calls/:callId/end')
  endCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe)
    callId: string,
  ) {
    return this.callsService.endCall(user.id, callId);
  }
}
