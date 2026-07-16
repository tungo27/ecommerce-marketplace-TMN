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

    // 1. Recent Orders
    const recentOrders = await this.prisma.order.findMany({
      where: { items: { some: { product: { sellerId } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          where: { product: { sellerId } },
          include: { product: { select: { name: true, images: true } } }
        }
      },
    });

    // 2. Top Products (by sold quantity in DELIVERED orders)
    const topProductsRaw = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.name, p.stock, p.price, p.images, COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
      LEFT JOIN "Order" o ON oi."orderId" = o.id
      WHERE p."sellerId" = ${sellerId} AND (o.status = 'DELIVERED' OR o.status IS NULL)
      GROUP BY p.id
      ORDER BY total_sold DESC, p.stock DESC
      LIMIT 5
    `;
    const topProducts = topProductsRaw.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      price: Number(p.price),
      images: p.images,
      totalSold: Number(p.total_sold)
    }));

    // 3. Low Stock Products
    const lowStockProducts = await this.prisma.product.findMany({
      where: { sellerId, stock: { lt: 5 } },
      take: 5,
      orderBy: { stock: 'asc' },
    });

    // 4. Recent Reviews
    const recentReviews = await this.prisma.review.findMany({
      where: { product: { sellerId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, images: true } },
      },
    });

    // 5. Sales Chart (Last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesDataRaw = await this.prisma.$queryRaw<any[]>`
      SELECT TO_CHAR(o."createdAt", 'YYYY-MM-DD') as date, COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM "Order" o
      JOIN "OrderItem" oi ON o.id = oi."orderId"
      JOIN "Product" p ON oi."productId" = p.id
      WHERE p."sellerId" = ${sellerId} AND o.status = 'DELIVERED'
        AND o."createdAt" >= current_date - interval '7 days'
      GROUP BY TO_CHAR(o."createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const salesChart = last7Days.map(date => {
      const found = salesDataRaw.find(d => d.date === date);
      return {
        name: date.split('-').slice(1).join('/'), // MM/DD format
        revenue: found ? Number(found.revenue) : 0,
        fullDate: date
      };
    });

    return {
      totalProducts,
      totalOrders,
      revenue: Number(revenue),
      newOrders,
      recentOrders,
      topProducts,
      lowStockProducts,
      recentReviews,
      salesChart
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
