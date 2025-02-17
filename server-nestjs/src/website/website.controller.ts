import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WebsiteProducerService } from './website.proceducer.service';
import { CreateWebsiteDto } from './website.dto';

@Controller('website')
export class WebsiteController {
  constructor(
    private readonly websiteProducerService: WebsiteProducerService,
  ) {}

  @Post('crawl')
  async createCrawlJob(@Body() createWebsiteDto: CreateWebsiteDto) {
    try {
      return await this.websiteProducerService.sendWebsiteMessage(
        createWebsiteDto.url,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create crawl job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
