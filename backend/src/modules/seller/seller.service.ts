import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(sellerId: string) {
    const totalProducts = await this.prisma.product.count({
      where: { sellerId },
    });

    const totalOrders = await this.prisma.order.count({
      where: {
        items: {
          some: {
            product: { sellerId },
          },
        },
      },
    });

    const newOrders = await this.prisma.order.count({
      where: {
        status: 'PENDING',
        items: {
          some: {
            product: { sellerId },
          },
        },
      },
    });

    // Lấy doanh thu bằng raw query cho tối ưu (chỉ tính order DELIVERED)
    // Tính tổng price * quantity của các OrderItem thuộc về sellerId
    const revenueResult = await this.prisma.$queryRaw<{ total_revenue: number }[]>`
      SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE p."sellerId" = ${sellerId} AND o.status = 'DELIVERED'
    `;

    const revenue = revenueResult[0]?.total_revenue || 0;

    return {
      totalProducts,
      totalOrders,
      revenue: Number(revenue),
      newOrders,
    };
  }

  async getSellerReviews(sellerId: string, productId?: string) {
    return this.prisma.review.findMany({
      where: {
        product: {
          sellerId,
        },
        ...(productId ? { productId } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        reply: true,
      },
    });
  }

  async replyToReview(sellerId: string, reviewId: string, comment: string) {
    // Kiểm tra xem review này có thuộc về product của seller không
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        product: {
          sellerId,
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission');
    }

    return this.prisma.reviewReply.upsert({
      where: {
        reviewId,
      },
      update: {
        comment,
      },
      create: {
        reviewId,
        comment,
      },
    });
  }
}
