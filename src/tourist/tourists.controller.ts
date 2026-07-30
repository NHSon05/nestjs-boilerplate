import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TouristsService } from './tourists.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateTouristProfileDto } from './dto/update-tourist-profile.dto';

@ApiTags('tourists')
@Controller('tourists')
export class TouristsController {
  constructor(private readonly touristsService: TouristsService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Tourist profile updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User account does not have TOURIST role',
  })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTouristProfileDto,
  ) {
    return this.touristsService.updateMyProfile(user.id, dto);
  }
}
