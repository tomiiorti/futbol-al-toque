import { Module } from '@nestjs/common';
import { VenuesModule } from '../venues/venues.module';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';

@Module({
  imports: [VenuesModule],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
