import { IsString, IsOptional } from 'class-validator';

export class GetLatestArticlesDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  parentCategory?: string;

  @IsOptional()
  @IsString()
  childCategory?: string;
}
