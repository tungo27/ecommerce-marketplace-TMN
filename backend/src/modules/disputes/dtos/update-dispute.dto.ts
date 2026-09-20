import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UpdateDisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED_REFUND = 'RESOLVED_REFUND',
  RESOLVED_REJECT = 'RESOLVED_REJECT',
}

export class UpdateDisputeDto {
  @IsEnum(UpdateDisputeStatus)
  @IsNotEmpty()
  status!: UpdateDisputeStatus;
}
