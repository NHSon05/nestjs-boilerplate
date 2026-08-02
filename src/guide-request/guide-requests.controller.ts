import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GuideRequestsService } from './guide-requests.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { CreateGuideRequestDto } from './dto/create-guide-request.dto';
import { GetMyGuideRequestsDto } from './dto/get-my-guide-request.dto';
import { RejectGuideRequestDto } from './dto/reject-guide-request.dto';
import { CancelGuideRequestDto } from './dto/cancel-guide-request.dto';

@ApiTags('guide-requests')
@ApiBearerAuth()
@Controller('guide-requests')
@UseGuards(JwtAuthGuard)
export class GuideRequestsController {
  constructor(private readonly guideRequestsService: GuideRequestsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Gửi yêu cầu hướng dẫn thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc thời gian không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Tài khoản không phải TOURIST hoặc không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy hướng dẫn viên',
  })
  @ApiResponse({
    status: 409,
    description: 'Hướng dẫn viên không sẵn sàng hoặc có yêu cầu trùng lặp',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGuideRequestDto,
  ) {
    return this.guideRequestsService.create(user.id, dto);
  }

  @Get('me')
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách các yêu cầu hướng dẫn',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token không hợp lệ',
  })
  findMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMyGuideRequestsDto,
  ) {
    return this.guideRequestsService.findMyRequests(user.id, query, user.role);
  }
  @Get(':requestId')
  @ApiParam({ name: 'requestId', description: 'UUID của yêu cầu hướng dẫn' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết của yêu cầu',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không có quyền xem yêu cầu này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy yêu cầu',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.guideRequestsService.findOne(user.id, requestId);
  }

  @Patch(':requestId/accept')
  @ApiParam({ name: 'requestId', description: 'UUID của yêu cầu hướng dẫn' })
  @ApiResponse({
    status: 200,
    description: 'Chấp nhận yêu cầu thành công, cuộc trò chuyện được khởi tạo',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không có quyền chấp nhận yêu cầu này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy yêu cầu',
  })
  @ApiResponse({
    status: 409,
    description: 'Yêu cầu đã được xử lý hoặc đã có cuộc trò chuyện',
  })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.guideRequestsService.accept(user.id, requestId);
  }

  @Patch(':requestId/reject')
  @ApiParam({ name: 'requestId', description: 'UUID của yêu cầu hướng dẫn' })
  @ApiResponse({
    status: 200,
    description: 'Từ chối yêu cầu thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không có quyền từ chối yêu cầu này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy yêu cầu',
  })
  @ApiResponse({
    status: 409,
    description: 'Yêu cầu đã được xử lý',
  })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: RejectGuideRequestDto,
  ) {
    return this.guideRequestsService.reject(user.id, requestId, dto);
  }

  @Patch(':requestId/cancel')
  @ApiParam({ name: 'requestId', description: 'UUID của yêu cầu hướng dẫn' })
  @ApiResponse({
    status: 200,
    description: 'Hủy yêu cầu thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không có quyền hủy yêu cầu này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy yêu cầu',
  })
  @ApiResponse({
    status: 409,
    description: 'Yêu cầu hiện tại không thể hủy',
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: CancelGuideRequestDto,
  ) {
    return this.guideRequestsService.cancel(user.id, requestId, dto);
  }
}
