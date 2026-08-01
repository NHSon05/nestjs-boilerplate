import { Module } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { GuidesController } from './guides.controller';
import { GeospatialModule } from 'src/geospatial/geospatial.module';
import { LocationsModule } from 'src/locations/locations.module';

@Module({
  imports: [GeospatialModule, LocationsModule],
  controllers: [GuidesController],
  providers: [GuidesService],
  exports: [GuidesService],
})
export class GuidesModule {}
