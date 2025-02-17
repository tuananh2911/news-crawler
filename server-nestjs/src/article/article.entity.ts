import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Article extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true }) // Unique index cho URL để tránh trùng lặp
  url: string;

  @Prop()
  id: number;

  @Prop({ required: true, index: true }) // Đánh index để tìm kiếm theo nguồn
  source: string;

  @Prop({ required: true, index: true }) // Đánh index giúp tìm kiếm nhanh theo danh mục cha
  parentCategory: string;

  @Prop({ required: true, index: true }) // Đánh index giúp tìm kiếm nhanh theo danh mục con
  childCategory: string;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
