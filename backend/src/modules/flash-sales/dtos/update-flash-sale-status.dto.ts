import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FlashSaleStatus } from '@prisma/client';

export class UpdateFlashSaleStatusDto {
  @IsEnum(FlashSaleStatus)
  status: FlashSaleStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
