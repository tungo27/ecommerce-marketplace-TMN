import { ForbiddenException, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { REDIS_CLIENT } from '../../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async createReview(userId: string, productId: string, dto: CreateReviewDto) {
    const { orderId, rating, comment } = dto;

    // 1. Kiểm tra xem user có đơn hàng orderId chứa productId ở trạng thái 'Delivered' hay không.
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
        status: 'DELIVERED', // Trạng thái đã giao
        items: {
          some: {
            productId: productId,
          },
        },
      },
    });

    if (!order) {
      throw new ForbiddenException('Order not found, does not belong to you, or has not been successfully delivered.');
    }

    // 2. Kiểm tra xem user đã review sản phẩm này cho order này chưa
    const existingReview = await this.prisma.review.findFirst({
      where: {
        orderId: orderId,
        productId: productId,
        userId: userId,
      },
    });

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this product for this order.');
    }

    // 3. Transaction: Chèn Review mới + Tính averageRating + Update Product
    const result = await this.prisma.$transaction(async (prisma) => {
      const newReview = await prisma.review.create({
        data: {
          userId,
          productId,
          orderId,
          rating,
          comment,
        },
      });

      const avgResult = await prisma.review.aggregate({
        where: {
          productId: productId,
        },
        _avg: {
          rating: true,
        },
      });

      const newAverageRating = avgResult._avg.rating || 0;

      await prisma.product.update({
        where: { id: productId },
        data: {
          averageRating: newAverageRating,
        },
      });

      return newReview;
    });

    // Xóa cache Redis liên quan đến product nếu có
    if (this.redisClient) {
        await this.redisClient.del(`product_${productId}`);
        await this.redisClient.del('products_list');
    }

    return result;
  }

  async getReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
      },
    });
  }
}
