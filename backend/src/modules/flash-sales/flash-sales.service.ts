import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFlashSaleDto } from './dtos/create-flash-sale.dto';
import { UpdateFlashSaleStatusDto } from './dtos/update-flash-sale-status.dto';

@Injectable()
export class FlashSalesService {
  constructor(private readonly prisma: PrismaService) {}

  async createFlashSale(sellerId: string, dto: CreateFlashSaleDto) {
    const { productId, discountPercentage, startTime, endTime } = dto;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time.');
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId },
    });

    if (!product) {
      throw new ForbiddenException('Product not found or does not belong to you.');
    }

    const originalPrice = Number(product.price);
    const salePrice = originalPrice * (1 - discountPercentage / 100);

    return this.prisma.flashSale.create({
      data: {
        productId,
        sellerId,
        discountPercentage,
        salePrice,
        startTime: start,
        endTime: end,
      },
    });
  }

  async getSellerFlashSales(sellerId: string) {
    return this.prisma.flashSale.findMany({
      where: { sellerId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminPendingFlashSales() {
    return this.prisma.flashSale.findMany({
      where: { status: 'PENDING' },
      include: {
        product: true,
        seller: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFlashSaleStatus(adminId: string, id: string, dto: UpdateFlashSaleStatusDto) {
    const flashSale = await this.prisma.flashSale.findUnique({ where: { id } });
    if (!flashSale) throw new NotFoundException('Flash sale not found');

    const [updated] = await this.prisma.$transaction([
      this.prisma.flashSale.update({
        where: { id },
        data: {
          status: dto.status,
          adminNote: dto.adminNote,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'FLASH_SALE',
          targetId: id,
          action: 'UPDATE_FLASH_SALE_STATUS',
          details: { newStatus: dto.status, note: dto.adminNote },
        }
      })
    ]);

    return updated;
  }

  async getActiveFlashSales() {
    const now = new Date();
    return this.prisma.flashSale.findMany({
      where: {
        status: 'APPROVED',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        product: true,
      },
      orderBy: { endTime: 'asc' },
    });
  }
}
