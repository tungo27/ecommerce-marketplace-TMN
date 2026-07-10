import { Body, Controller, Param, Post, Get, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('products')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  async createReview(
    @Param('id') productId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.reviewsService.createReview(userId, productId, createReviewDto);
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') productId: string) {
    return this.reviewsService.getReviews(productId);
  }
}
