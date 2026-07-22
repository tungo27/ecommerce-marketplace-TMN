import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

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
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug }
    });
    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    const [category] = await this.prisma.$transaction([
      this.prisma.category.create({ data: dto }),
      this.prisma.auditLog.create({
        data: {
          adminId,
          targetType: 'CATEGORY',
          targetId: dto.slug,
          action: 'CREATE_CATEGORY',
          details: { categoryName: dto.name },
        }
      })
    ]);
    return category;
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
    return deleted;
  }
}
