import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { CreateProductDto } from './dtos/create-product.dto';
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

  async findSellerProducts(sellerId: string, status?: string) {
    const whereConditions: any = { sellerId };

    if (status) {
      whereConditions.status = status;
    }

    return this.prismaService.product.findMany({
      where: whereConditions,
      orderBy: { updatedAt: 'desc' },
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

  async patchSellerProductStatus(sellerId: string, productId: string, status: 'Draft' | 'Hidden') {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have permission to change this product status');
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
}
