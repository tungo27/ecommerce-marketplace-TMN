import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductReportDto, ReviewProductReportDto } from './dtos/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateProductReportDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || product.status !== 'Published') {
      throw new NotFoundException('Product not found');
    }

    // Prevent duplicate reports from same user
    const existing = await this.prisma.productReport.findUnique({
      where: { productId_reporterId: { productId: dto.productId, reporterId: userId } },
    });
    if (existing) {
      throw new BadRequestException('You have already reported this product');
    }

    return this.prisma.productReport.create({
      data: {
        productId: dto.productId,
        reporterId: userId,
        reason: dto.reason,
        description: dto.description,
      },
    });
  }

  async getMyReports(userId: string) {
    return this.prisma.productReport.findMany({
      where: { reporterId: userId },
      include: {
        product: { select: { id: true, name: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllReports() {
    return this.prisma.productReport.findMany({
      include: {
        product: { select: { id: true, name: true, images: true, seller: { select: { id: true, name: true } } } },
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewReport(adminId: string, reportId: string, dto: ReviewProductReportDto) {
    const report = await this.prisma.productReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const [updatedReport] = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.productReport.update({
        where: { id: reportId },
        data: { status: dto.status, adminNote: dto.adminNote },
      });

      // If approved, hide the product
      if (dto.status === 'APPROVED') {
        await tx.product.update({
          where: { id: report.productId },
          data: { status: 'Hidden' },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          targetType: 'PRODUCT_REPORT',
          targetId: reportId,
          action: dto.status === 'APPROVED' ? 'APPROVE_REPORT' : 'REJECT_REPORT',
          details: { productId: report.productId, adminNote: dto.adminNote },
        },
      });

      return [updated];
    });

    return updatedReport;
  }
}
