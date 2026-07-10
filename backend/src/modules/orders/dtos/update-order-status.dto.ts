import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái đơn hàng không được để trống' })
  @IsEnum(OrderStatus, {
    message:
      'Trạng thái đơn hàng không hợp lệ (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)',
  })
  status!: OrderStatus;
}
