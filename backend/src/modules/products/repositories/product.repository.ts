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

    // -------------------------------------------------------------------------
    // MODE 1: Full-Text Search (FTS) using Raw SQL
    // -------------------------------------------------------------------------
    if (query.search && query.search.trim() !== '') {
      const searchQuery = query.search; // This is the built tsquery string from the service

      // We use Prisma.sql to safely parameterize inputs
      // 'unaccent' requires the pg extension which is added via migration
      const rawQuery = Prisma.sql`
        SELECT 
          p.id,
          count(p.id) OVER() as full_count,
          ts_rank(
            setweight(to_tsvector('simple', f_unaccent(coalesce(p.name::text, ''))), 'A') ||
            setweight(to_tsvector('simple', f_unaccent(coalesce(p.description::text, ''))), 'B'),
            to_tsquery('simple', ${searchQuery})
          ) as rank
        FROM "Product" p
        WHERE p.status = 'Published' 
          AND p.stock > 0
          AND (
            setweight(to_tsvector('simple', f_unaccent(coalesce(p.name::text, ''))), 'A') ||
            setweight(to_tsvector('simple', f_unaccent(coalesce(p.description::text, ''))), 'B')
          ) @@ to_tsquery('simple', ${searchQuery})
          ${query.category ? Prisma.sql`AND p.category = CAST(${query.category} AS "Category")` : Prisma.empty}
          ${query.minPrice !== undefined ? Prisma.sql`AND p.price >= ${query.minPrice}` : Prisma.empty}
          ${query.maxPrice !== undefined ? Prisma.sql`AND p.price <= ${query.maxPrice}` : Prisma.empty}
        ORDER BY rank DESC, p."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const ftsResults = await this.prisma.$queryRaw<any[]>(rawQuery);

      const total = ftsResults.length > 0 ? Number(ftsResults[0].full_count) : 0;
      const productIds = ftsResults.map(r => r.id);

      if (productIds.length === 0) {
        return { products: [], meta: { total: 0, totalPages: 0, currentPage: page, limit } };
      }

      // Fetch the full product data with relations
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          seller: { select: { name: true } },
          _count: { select: { reviews: true } },
        },
      });

      // Preserve the ranked order from the FTS query
      const sortedProducts = productIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean) as any[];

      const mappedProducts = sortedProducts.map(({ _count, ...rest }) => ({
        ...rest,
        reviewCount: _count.reviews,
      }));

      return { products: mappedProducts, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
    }

    // -------------------------------------------------------------------------
    // MODE 2: Normal Browse (Filters only, no FTS)
    // -------------------------------------------------------------------------
    const whereConditions: Prisma.ProductWhereInput[] = [
      { status: ProductStatus.Published },
      { stock: { gt: 0 } },
    ];

    if (query.category) whereConditions.push({ category: query.category as any });
    if (query.minPrice !== undefined) whereConditions.push({ price: { gte: Number(query.minPrice) } });
    if (query.maxPrice !== undefined) whereConditions.push({ price: { lte: Number(query.maxPrice) } });

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
