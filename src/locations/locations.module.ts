import { Module } from '@nestjs/common';
import { LocationController } from './locations.controller';
import { LocationService } from './locations.service';

@Module({
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationsModule {}
