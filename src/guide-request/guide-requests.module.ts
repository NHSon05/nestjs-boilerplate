import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GuideRequestsController } from './guide-requests.controller';
import { GuideRequestsService } from './guide-requests.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GuideRequestsController],
  providers: [GuideRequestsService],
  exports: [GuideRequestsService],
})
export class GuideRequestsModule {}
