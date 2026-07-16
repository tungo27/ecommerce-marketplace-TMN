import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { QueryProductDto } from './dtos/query-product.dto';
import { ProductRepository } from './repositories/product.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly prismaService: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  private normalizeSearchKeyword(keyword: string): string {
    return keyword
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  async findPublicProducts(query: QueryProductDto) {
    const normalizedQuery = { ...query };

    if (typeof query.search === 'string' && query.search.trim()) {
      normalizedQuery.search = this.normalizeSearchKeyword(query.search);
    }

    return this.productRepository.findPublicProducts(normalizedQuery);
  }

  async findPublicProductById(id: string) {
    const product = await this.prismaService.product.findFirst({
      where: {
        id,
        status: 'Published',
      },
      include: {
        seller: {
          select: { name: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not published');
    }

    return product;
  }

  async findSellerProducts(sellerId: string, status?: string) {
    const whereConditions: any = { sellerId };

    if (status) {
      whereConditions.status = status;
    }

    const products = await this.prismaService.product.findMany({
      where: whereConditions,
      orderBy: { updatedAt: 'desc' },
      include: {
        AuditLog: {
          where: { action: 'REJECT' },
          take: 1,
        },
      },
    });

    return products.map(product => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { AuditLog, ...rest } = product;
      return {
        ...rest,
        isRejected: product.status === 'Hidden' && AuditLog.length > 0,
      };
    });
  }

  async findSellerProductById(sellerId: string, productId: string) {
    return this.prismaService.product.findFirst({
      where: {
        id: productId,
        sellerId,
      },
    });
  }

async updateSellerProduct(sellerId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
      include: {
        AuditLog: {
          where: { action: 'REJECT' },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    if (product.status === 'Hidden' && product.AuditLog.length > 0) {
      throw new ForbiddenException('This product has been rejected by an admin and cannot be edited');
    }

    const currentPrice = Number(product.price);
    const coreFieldsChanged =
      (dto.name !== undefined && dto.name.trim() !== product.name) ||
      (dto.price !== undefined && dto.price !== currentPrice) ||
      (dto.category !== undefined && dto.category !== product.category);

    const updateData: any = {
      description: dto.description !== undefined ? dto.description.trim() : product.description,
      stock: dto.stock !== undefined ? dto.stock : product.stock,
    };

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }
    if (dto.price !== undefined) {
      updateData.price = dto.price;
    }
    if (dto.category !== undefined) {
      updateData.category = dto.category;
    }

    if (coreFieldsChanged) {
      updateData.status = ProductStatus.Pending;
      updateData.version = product.version + 1;
    }

    return this.prismaService.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  async patchSellerProductStatus(sellerId: string, productId: string, status: 'Published' | 'Hidden') {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
      include: {
        AuditLog: {
          where: { action: 'REJECT' },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have permission to change this product status');
    }

    if (product.status === 'Hidden' && product.AuditLog.length > 0) {
      throw new ForbiddenException('This product has been rejected by an admin and cannot be modified');
    }

    if (status === 'Hidden' && product.status !== 'Published') {
      throw new BadRequestException('Only published products can be hidden');
    }

    if (status === 'Published' && product.status !== 'Hidden') {
      throw new BadRequestException('Only hidden products can be unhidden to published');
    }

    return this.prismaService.product.update({
      where: { id: productId },
      data: {
        status,
      },
    });
  }

  async createProduct(sellerId: string, dto: CreateProductDto, files: Express.Multer.File[]) {
    const uploadedImageUrls = await Promise.all(files.map((file) => this.uploadService.uploadImage(file)));

    return this.prismaService.product.create({
      data: {
        name: dto.name.trim(),
        description: dto.description.trim(),
        price: dto.price,
        category: dto.category,
        stock: dto.stock,
        images: uploadedImageUrls,
        sellerId,
        status: ProductStatus.Pending,
        averageRating: 0.0,
        version: 1,
      },
    });
  }

  async getPendingProducts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prismaService.product.findMany({
        where: { status: ProductStatus.Pending },
        include: { seller: { select: { name: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prismaService.product.count({
        where: { status: ProductStatus.Pending },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async reviewProduct(adminId: string, productId: string, action: 'APPROVE' | 'REJECT') {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== ProductStatus.Pending) {
      throw new BadRequestException('Product is not in Pending status');
    }

    const newStatus = action === 'APPROVE' ? ProductStatus.Published : ProductStatus.Hidden;

    await this.prismaService.$transaction([
      this.prismaService.product.update({
        where: { id: productId },
        data: { status: newStatus },
      }),
      this.prismaService.auditLog.create({
        data: {
          adminId,
          productId,
          action,
        },
      }),
    ]);

    return { message: 'Product status updated successfully' };
  }
}
