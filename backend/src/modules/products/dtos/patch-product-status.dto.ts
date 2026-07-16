import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class PatchProductStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Published', 'Hidden'])
  status: 'Published' | 'Hidden';
}
