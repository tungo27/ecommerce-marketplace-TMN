import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { QueryProductDto } from '../dtos/query-product.dto';
import { Prisma, ProductStatus } from '@prisma/client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicProducts(query: QueryProductDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.ProductWhereInput[] = [
      { status: ProductStatus.Published },
      { stock: { gt: 0 } }
    ];

    if (query.category) whereConditions.push({ category: query.category });
    if (query.minPrice !== undefined) whereConditions.push({ price: { gte: query.minPrice } });
    if (query.maxPrice !== undefined) whereConditions.push({ price: { lte: query.maxPrice } });
    
    // Xử lý Full-Text Search an toàn với TypeScript
    if (query.search && query.search.trim() !== '') {
      const searchStr = query.search.trim().split(/\s+/).join(' | ');
      whereConditions.push({
        OR: [
          { name: { search: searchStr } as any },
          { description: { search: searchStr } as any }
        ]
      });
    }

    const where: Prisma.ProductWhereInput = { AND: whereConditions };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { seller: { select: { name: true } } }, // Lấy tên Shop (TechZone)
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }
}