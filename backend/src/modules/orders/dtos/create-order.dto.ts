import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  shippingAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phoneNumber: string;

  @IsString()
  @IsIn(['COD', 'BANK_TRANSFER'], {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  paymentMethod: string;
}
