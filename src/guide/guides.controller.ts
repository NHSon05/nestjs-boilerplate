import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GuidesService } from './guides.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateGuideProfileDto } from './dto/update-guide-profile.dto';
import { AddGuideLanguageDto } from './dto/guide-language.dto';
import { FindNearbyGuidesDto } from 'src/locations/dto/find-nearby-guides.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { LocationService } from 'src/locations/locations.service';

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(
    private readonly guidesService: GuidesService,
    private readonly locationsServices: LocationService,
  ) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Guide profile updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User account does not have GUIDE role',
  })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGuideProfileDto,
  ) {
    return this.guidesService.updateMyProfile(user.id, dto);
  }

  @Get('me/languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Return list of registered guide languages',
  })
  @ApiResponse({
    status: 403,
    description: 'User account does not have GUIDE role',
  })
  getMyLanguages(@CurrentUser() user: AuthenticatedUser) {
    return this.guidesService.getMyLanguages(user.id);
  }

  @Post('me/languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Guide language proficiency level updated',
  })
  @ApiResponse({
    status: 201,
    description: 'Guide language successfully added',
  })
  @ApiResponse({
    status: 404,
    description: 'Target language ID not found in system',
  })
  addLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddGuideLanguageDto,
  ) {
    return this.guidesService.addLanguage(user.id, dto);
  }

  @Delete('me/languages/:languageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'languageId', description: 'Language UUID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Language successfully removed from profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Language not found in guide profile',
  })
  removeLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('languageId') languageId: string,
  ) {
    return this.guidesService.removeLanguage(user.id, languageId);
  }

  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách hướng dẫn viên trong bán kính',
  })
  findNearBy(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindNearbyGuidesDto,
  ) {
    return this.guidesService.findNearby(user.id, query);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái sẵn sàng thành công',
  })
  updateAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.guidesService.updateAvailability(user.id, dto);
  }

  @Get(':guideId')
  @ApiParam({ name: 'guideId', description: 'UUID của hướng dẫn viên' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin hồ sơ HDV',
  })
  getPublicProfile(@Param('guideId', ParseUUIDPipe) guideId: string) {
    return this.guidesService.getPublicProfile(guideId);
  }

  @Put()
  updateCurrentLocation(@CurrentUser() user: AuthenticatedUser) {
    return this.locationsServices.getMyCurrentLocation(user.id);
  }
}
