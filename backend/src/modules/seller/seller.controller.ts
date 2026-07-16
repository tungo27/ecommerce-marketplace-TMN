import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { SellerService } from '../seller/seller.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/guards/roles.decorator';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('dashboard/stats')
  async getDashboardStats(@Req() req: { user: { id: string } }) {
    return this.sellerService.getDashboardStats(req.user.id);
  }

  @Get('reviews')
  async getSellerReviews(
    @Req() req: { user: { id: string } },
    @Query('productId') productId?: string,
  ) {
    return this.sellerService.getSellerReviews(req.user.id, productId);
  }

  @Post('reviews/:id/reply')
  async replyToReview(
    @Req() req: { user: { id: string } },
    @Param('id') reviewId: string,
    @Body('comment') comment: string,
  ) {
    return this.sellerService.replyToReview(req.user.id, reviewId, comment);
  }
}
