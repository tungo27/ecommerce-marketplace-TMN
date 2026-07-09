import { IsArray, IsNotEmpty, IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SyncCartItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class SyncCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemDto)
  items!: SyncCartItemDto[];
}
