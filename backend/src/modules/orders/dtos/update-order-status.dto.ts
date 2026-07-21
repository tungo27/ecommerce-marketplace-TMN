import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Order status must not be empty' })
  @IsEnum(OrderStatus, {
    message: 'Invalid order status. Must be one of: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, CANCELLATION_REQUESTED',
  })
  status!: OrderStatus;
}
