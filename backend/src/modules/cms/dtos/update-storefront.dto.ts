import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateStorefrontDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsString()
  heroProductId?: string;

  @IsOptional()
  @IsString()
  announcement?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuredCategoryIds?: string[];
}
