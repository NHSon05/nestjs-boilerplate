import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LocationService } from './locations.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateCurrentLocationDto } from './dto/update-current-location.dto';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('users/me/location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Put()
  @ApiResponse({
    status: 200,
    description: 'Cập nhật vị trí hiện tại thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid Access Token',
  })
  updateCurrentLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCurrentLocationDto,
  ) {
    return this.locationService.updateCurrentLocation(user.id, dto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lấy vị trí hiện tại thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid Access Token',
  })
  getMyCurrentLocation(@CurrentUser() user: AuthenticatedUser) {
    return this.locationService.getMyCurrentLocation(user.id);
  }
}
