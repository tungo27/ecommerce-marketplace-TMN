import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryProductDto } from '../dtos/query-product.dto';
import { Prisma, ProductStatus } from '@prisma/client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicProducts(query: QueryProductDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 12);
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.ProductWhereInput[] = [
      { status: ProductStatus.Published },
      { stock: { gt: 0 } },
    ];

    if (query.category) whereConditions.push({ category: query.category as any });
    if (query.minPrice !== undefined) whereConditions.push({ price: { gte: Number(query.minPrice) } });
    if (query.maxPrice !== undefined) whereConditions.push({ price: { lte: Number(query.maxPrice) } });

    if (query.search && query.search.trim() !== '') {
      // search may be a comma-separated list of expanded synonyms
      const terms = query.search.split(',').map(t => t.trim()).filter(Boolean);
      const termConditions: Prisma.ProductWhereInput[] = terms.map(term => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' as const } },
          { description: { contains: term, mode: 'insensitive' as const } },
        ],
      }));
      // A product matches if ANY of the synonym terms matches
      whereConditions.push({ OR: termConditions });
    }

    const where: Prisma.ProductWhereInput = { AND: whereConditions };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          seller: { select: { name: true } },
          _count: { select: { reviews: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const mappedProducts = products.map(({ _count, ...rest }) => ({
      ...rest,
      reviewCount: _count.reviews,
    }));

    return { products: mappedProducts, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
  }
}
