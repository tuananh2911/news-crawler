import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from './article.entity';
import { Consumer, Kafka } from 'kafkajs';
import { GetLatestArticlesDto } from './article.dto';

@Injectable()
export class ArticleService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor(@InjectModel(Article.name) private articleModel: Model<Article>) {
    this.kafka = new Kafka({
      clientId: 'article-consumer',
      brokers: [process.env.KAFKA_BROKERS], // Điều chỉnh theo cấu hình của bạn
    });

    this.consumer = this.kafka.consumer({ groupId: 'article-consumer-group' });
  }

  async getLatestArticles(query: GetLatestArticlesDto) {
    const { source, parentCategory, childCategory } = query;

    // Xây dựng filter object dựa trên các tham số được cung cấp
    const filter: any = {};

    if (source) {
      filter.source = source;
    }

    if (parentCategory) {
      filter.parentCategory = parentCategory;
    }

    if (childCategory) {
      filter.childCategory = childCategory;
    }
    console.log(filter)

    // Thực hiện truy vấn với filter và sắp xếp theo timestamp giảm dần
    const articles = await this.articleModel
      .find(filter)
      .sort({ id: -1 })
      .limit(10)
      .select('title url id source parentCategory childCategory')
      .exec();

    // Đếm tổng số bài viết thỏa mãn điều kiện
    const total = await this.articleModel.countDocuments(filter);

    return {
      data: articles,
      total,
      limit: 10,
    };
  }
  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'article', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const articleData = JSON.parse(message.value.toString());
          console.log(articleData)
          await this.processArticle(articleData);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async processArticle(articleData: any) {
    try {
      // Kiểm tra xem bài viết đã tồn tại chưa
      const existingArticle = await this.articleModel.findOne({
        id: articleData.id,
      });

      if (!existingArticle) {
        const newArticle = new this.articleModel(articleData);
        await newArticle.save();
        console.log(`Saved new article: ${articleData.title}`);
      } else {
        console.log(`Article already exists: ${articleData.title}`);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      throw error;
    }
  }
}
