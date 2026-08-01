import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GeospatialService } from './geospatial.service';

@Module({
  imports: [DatabaseModule],
  providers: [GeospatialService],
  exports: [GeospatialService],
})
export class GeospatialModule {}
