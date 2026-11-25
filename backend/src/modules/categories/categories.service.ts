import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async findAllPublic() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  }

  async create(adminId: string, dto: CreateCategoryDto) {
    // The backoffice form only sends name/description, so generate a unique
    // slug when it is omitted instead of rejecting the request with a 400.
    let slug: string;
    if (dto.slug) {
      slug = dto.slug.trim();
      const existing = await this.prisma.category.findUnique({
        where: { slug }
      });
      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
    } else {
      const baseSlug = this.buildSlug(dto.name);
      slug = baseSlug;
      let suffix = 2;
      while (await this.prisma.category.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
    }

    const [category] = await this.prisma.$transaction([
      this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description,
          isActive: dto.isActive ?? true,
        }
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'CATEGORY',
          targetId: slug,
          action: 'CREATE_CATEGORY',
          details: { categoryName: dto.name.trim() },
        }
      })
    ]);
    await this.invalidatePublicCategories();
    return category;
  }

  private buildSlug(name: string): string {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'category';
  }

  private async invalidatePublicCategories(): Promise<void> {
    try {
      await this.cacheInvalidationService.invalidateCategoryCaches();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to invalidate public categories cache: ${message}`);
    }
  }

  async update(adminId: string, id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }
    
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: dto.slug }
      });
      if (slugExists) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id },
        data: dto
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'CATEGORY',
          targetId: id,
          action: 'UPDATE_CATEGORY',
          details: { updates: dto as any },
        }
      })
    ]);
    await this.invalidatePublicCategories();
    return updated;
  }

  async remove(adminId: string, id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });
    
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (existing._count.products > 0) {
      throw new ConflictException('Cannot delete category with associated products');
    }

    const [deleted] = await this.prisma.$transaction([
      this.prisma.category.delete({
        where: { id }
      }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'CATEGORY',
          targetId: id,
          action: 'DELETE_CATEGORY',
          details: { categoryName: existing.name },
        }
      })
    ]);
    await this.invalidatePublicCategories();
    return deleted;
  }
}
