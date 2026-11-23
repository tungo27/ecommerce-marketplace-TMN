import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { CreateReviewDto } from './dtos/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheInvalidationService: CacheInvalidationService,
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

    // 3. Transaction: Chèn Review mới + Tính averageRating (chỉ review hiển thị) + Update Product
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
          isHidden: false,
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

    // Xóa cache của product detail + danh sách sản phẩm để điểm đánh giá mới
    // được hiển thị ngay lập tức.
    await this.cacheInvalidationService.invalidateProductCaches(productId);

    return result;
  }

  async getReviews(productId: string) {
    return this.prisma.review.findMany({
      where: {
        productId,
        isHidden: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
        reply: true,
      },
    });
  }
}
