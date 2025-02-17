import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArticleModule } from './article/article.module';
import { ArticleService } from './article/article.service';
import { ArticleController } from './article/article.controller';
import { WebsiteModule } from './website/website.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI), // Điều chỉnh URL MongoDB của bạn
    ArticleModule,
    WebsiteModule,
  ]
})
export class AppModule {}
