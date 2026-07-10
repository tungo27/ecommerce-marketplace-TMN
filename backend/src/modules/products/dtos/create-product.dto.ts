import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Category } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  price!: number;

  @IsEnum(Category)
  category!: Category;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}
