import { IsString, IsUrl } from 'class-validator';

export class CreateWebsiteDto {
  @IsString()
  @IsUrl()
  url: string;
}
