import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryUsersDto } from './dtos/query-users.dto';
import { QueryOrdersDto } from './dtos/query-orders.dto';
import { QueryTransactionsDto } from './dtos/query-transactions.dto';
import { QueryAdminReviewsDto } from './dtos/query-admin-reviews.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // 1. DASHBOARD STATS
  // ---------------------------------------------------------------------------
  async getDashboardStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalOrders,
      newUsers,
      newSellers,
      orderStatusCounts,
      categoryProductCounts,
      gmvResult,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count({
        where: { role: 'CUSTOMER', createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.user.count({
        where: { role: 'SELLER', createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.product.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
      }),
      this.prisma.$queryRaw<{ gmv: number }[]>`
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0)::float as gmv
        FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o.status = 'DELIVERED'
      `,
    ]);

    return {
      gmv: gmvResult[0]?.gmv ?? 0,
      totalOrders,
      newUsers,
      newSellers,
      orderStatusChart: orderStatusCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      categoryProductChart: categoryProductCounts.map((c) => ({
        category: c.categoryId,
        count: c._count.categoryId,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // 2. AUDIT LOGS
  // ---------------------------------------------------------------------------
  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true } },
          product: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { logs, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  // ---------------------------------------------------------------------------
  // 3. PRODUCT MODERATION
  // ---------------------------------------------------------------------------
  async getAllProducts(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {};
    if (status) where.status = status as any;

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { seller: { select: { name: true, email: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true } },
        seller: { select: { name: true, email: true } },
      }
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async forceHideProduct(adminId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status === 'Hidden') {
      throw new BadRequestException('Product is already hidden');
    }

    const [updatedProduct] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { status: 'Hidden' },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          productId,
          action: 'FORCE_HIDE',
        },
      }),
    ]);

    return updatedProduct;
  }

  // ---------------------------------------------------------------------------
  // 4. USER MANAGEMENT
  // ---------------------------------------------------------------------------
  async getUsers(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role as any;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { products: true, orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  async toggleUserBan(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  async getSellerProfile(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId, role: 'SELLER' },
      select: { id: true, name: true, email: true, isActive: true, createdAt: true },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    const [totalProducts, revenueResult, ratingResult] = await Promise.all([
      this.prisma.product.count({ where: { sellerId } }),
      this.prisma.$queryRaw<{ total_revenue: number }[]>`
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0)::float as total_revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE p."sellerId" = ${sellerId} AND o.status = 'DELIVERED'
      `,
      this.prisma.review.aggregate({
        where: { product: { sellerId } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      ...seller,
      totalProducts,
      totalRevenue: revenueResult[0]?.total_revenue ?? 0,
      averageRating: ratingResult._avg.rating ?? 0,
      totalReviews: ratingResult._count.rating,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. ORDER MANAGEMENT
  // ---------------------------------------------------------------------------
  async getAllOrders(query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status as any;
    if (query.search) where.id = { contains: query.search, mode: 'insensitive' };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  async forceCancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel a delivered order');
    }
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.transaction.create({
        data: {
          orderId,
          accountId: 'ADMIN_SYSTEM',
          amount: order.totalAmount,
          type: 'REFUND',
          description: 'Admin force cancel — refund pending',
          status: 'PENDING',
        },
      }),
    ]);

    return updatedOrder;
  }

  // ---------------------------------------------------------------------------
  // 6. TRANSACTION MANAGEMENT
  // ---------------------------------------------------------------------------
  async getTransactions(query: QueryTransactionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              customer: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  // ---------------------------------------------------------------------------
  // 7. REVIEW MODERATION
  // ---------------------------------------------------------------------------
  async getAllReviews(query: QueryAdminReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true } },
          reply: true,
        },
      }),
      this.prisma.review.count(),
    ]);

    return { reviews, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }

  async toggleReviewVisibility(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: !review.isHidden },
      select: { id: true, isHidden: true },
    });
  }
}
