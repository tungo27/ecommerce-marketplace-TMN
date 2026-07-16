import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Shipping address must not be empty' })
  shippingAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number must not be empty' })
  phoneNumber: string;

  @IsString()
  @IsIn(['COD', 'BANK_TRANSFER'], { message: 'Invalid payment method' })
  paymentMethod: string;
}
