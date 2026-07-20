import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';
import { QueryUsersDto } from './dtos/query-users.dto';
import { QueryOrdersDto } from './dtos/query-orders.dto';
import { QueryTransactionsDto } from './dtos/query-transactions.dto';
import { QueryAdminReviewsDto } from './dtos/query-admin-reviews.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ----- DASHBOARD -----
  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ----- AUDIT LOGS -----
  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ----- PRODUCT MODERATION -----
  @Get('products')
  getProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllProducts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Get('products/:id')
  getProductById(@Param('id') productId: string) {
    return this.adminService.getProductById(productId);
  }

  @Patch('products/:id/force-hide')
  forceHideProduct(
    @Req() req: { user: { id: string } },
    @Param('id') productId: string,
  ) {
    return this.adminService.forceHideProduct(req.user.id, productId);
  }

  // ----- USER MANAGEMENT -----
  @Get('users')
  getUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/ban')
  toggleUserBan(
    @Param('id') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleUserBan(userId, isActive);
  }

  @Get('sellers/:id/profile')
  getSellerProfile(@Param('id') sellerId: string) {
    return this.adminService.getSellerProfile(sellerId);
  }

  // ----- ORDER MANAGEMENT -----
  @Get('orders')
  getAllOrders(@Query() query: QueryOrdersDto) {
    return this.adminService.getAllOrders(query);
  }

  @Patch('orders/:id/force-cancel')
  forceCancelOrder(@Param('id') orderId: string) {
    return this.adminService.forceCancelOrder(orderId);
  }

  // ----- TRANSACTION MANAGEMENT -----
  @Get('transactions')
  getTransactions(@Query() query: QueryTransactionsDto) {
    return this.adminService.getTransactions(query);
  }

  // ----- REVIEW MODERATION -----
  @Get('reviews')
  getAllReviews(@Query() query: QueryAdminReviewsDto) {
    return this.adminService.getAllReviews(query);
  }

  @Patch('reviews/:id/toggle-hide')
  toggleReviewVisibility(@Param('id') reviewId: string) {
    return this.adminService.toggleReviewVisibility(reviewId);
  }
}
