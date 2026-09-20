import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProductReportDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reason!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;
}

export class ReviewProductReportDto {
  @IsString()
  @IsNotEmpty()
  status!: 'APPROVED' | 'REJECTED';

  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
