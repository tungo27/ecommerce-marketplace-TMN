import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Query, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { GetOrdersDto } from './dtos/get-orders.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { IsBoolean } from 'class-validator';

class CancellationDecisionDto {
  @IsBoolean()
  approve!: boolean;
}

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
      message: 'Order history retrieved successfully',
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
      message: 'Order placed successfully',
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
      message: 'Order status updated successfully',
      data: updatedOrder,
    };
  }

  @Patch(':orderId/cancel')
  @UseGuards(AuthGuard('jwt'))
  async requestCancellation(
    @GetUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    const result = await this.ordersService.requestCancellation(orderId, user.id);
    return {
      message: 'Cancellation request submitted. Awaiting seller approval.',
      data: result,
    };
  }

  @Patch('seller/:orderId/cancellation')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SELLER)
  async handleCancellationRequest(
    @GetUser() user: any,
    @Param('orderId') orderId: string,
    @Body() body: CancellationDecisionDto,
  ) {
    const result = await this.ordersService.handleCancellationRequest(
      orderId,
      user.id,
      body.approve,
    );
    return {
      message: body.approve ? 'Cancellation approved.' : 'Cancellation rejected.',
      data: result,
    };
  }
}
