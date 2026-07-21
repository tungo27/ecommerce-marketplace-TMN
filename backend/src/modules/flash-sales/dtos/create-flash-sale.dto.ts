import { IsDateString, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateFlashSaleDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(99)
  discountPercentage: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
