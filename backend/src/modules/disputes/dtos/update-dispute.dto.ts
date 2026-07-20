import { IsEnum, IsNotEmpty } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class UpdateDisputeDto {
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status!: DisputeStatus;
}
