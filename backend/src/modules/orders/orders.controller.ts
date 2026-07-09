import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { GetOrdersDto } from './dtos/get-orders.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('my-orders')
  @UseGuards(AuthGuard('jwt'))
  async getMyOrders(
    @Query() getOrdersDto: GetOrdersDto,
    @GetUser() user: any,
  ) {
    const orders = await this.ordersService.getMyOrders(user.id, getOrdersDto);
    return {
      message: 'Lấy lịch sử đơn hàng thành công',
      data: orders,
    };
  }

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('CUSTOMER')
  async checkout(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: any,
  ) {
    const order = await this.ordersService.createOrder(user.id, createOrderDto);
    
    return {
      message: 'Đặt hàng thành công',
      data: order,
    };
  }
}
