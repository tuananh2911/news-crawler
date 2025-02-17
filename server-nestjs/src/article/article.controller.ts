import { Controller, Get, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { GetLatestArticlesDto } from './article.dto';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get('latest')
  async getLatestArticles(@Query() query: GetLatestArticlesDto) {
    return this.articleService.getLatestArticles(query);
  }
}
