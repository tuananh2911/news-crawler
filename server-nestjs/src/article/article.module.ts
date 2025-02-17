import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArticleService } from './article.service';
import { Article, ArticleSchema } from './article.entity';
import { ArticleController } from './article.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  providers: [ArticleService],
  controllers: [ArticleController]
})
export class ArticleModule {}
