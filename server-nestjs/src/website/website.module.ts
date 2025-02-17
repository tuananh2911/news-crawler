import { Module } from '@nestjs/common';
import { WebsiteService } from './website.service';
import { WebsiteController } from './website.controller';
import { WebsiteProducerService } from './website.proceducer.service';

@Module({

  controllers:[WebsiteController],
  providers: [WebsiteService, WebsiteProducerService],
})
export class WebsiteModule {}
