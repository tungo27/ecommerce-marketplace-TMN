import { IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}
