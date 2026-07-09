import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Query, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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

  @Get('seller')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SELLER)
  async getSellerOrders(
    @GetUser() user: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return this.ordersService.getSellerOrders(user.id, pageNum, limitNum);
  }

  @Patch('seller/:orderId/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SELLER)
  async updateOrderStatus(
    @GetUser() user: any,
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const updatedOrder = await this.ordersService.updateOrderStatus(
      orderId,
      user.id,
      updateOrderStatusDto.status,
    );

    return {
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: updatedOrder,
    };
  }
}
