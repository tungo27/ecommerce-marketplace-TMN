import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '@prisma/client';

export class QueryProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
