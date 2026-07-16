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

  // ---------------------------------------------------------------------------
  // Keyword Normalization
  // ---------------------------------------------------------------------------

  /**
   * Strip Vietnamese diacritics, lowercase, and sanitize the keyword so it
   * contains only ASCII letters/digits and spaces — safe for building tsquery.
   */
  private normalizeSearchKeyword(keyword: string): string {
    return keyword
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // remove diacritics (ă→a, ơ→o, etc.)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')   // remove non-alphanumeric (|, &, !, etc.)
      .replace(/\s+/g, ' ')           // collapse whitespace
      .trim();
  }

  // ---------------------------------------------------------------------------
  // Synonym Map  (Vietnamese ↔ English, accent-stripped keys)
  // ---------------------------------------------------------------------------

  /**
   * Keys are accent-stripped Vietnamese words (already normalized via normalizeSearchKeyword).
   * Values are English equivalents that should also be searched.
   */
  private readonly SYNONYM_MAP: Record<string, string[]> = {
    // Footwear
    'giay': ['shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'loafer', 'heel', 'footwear'],
    'dep':  ['sandal', 'slipper', 'flipflop'],
    // Clothing — single-word keys
    'ao':   ['shirt', 'blouse', 'top', 'hoodie', 'sweater', 'polo', 'tshirt'],
    'quan': ['pant', 'trouser', 'jeans', 'short', 'legging'],
    'vay':  ['dress', 'skirt'],
    // Clothing — multi-word phrases (normalized, no diacritics)
    'ao khoac': ['jacket', 'coat', 'hoodie', 'cardigan'],
    'ao phong':  ['tshirt', 'polo'],
    // Electronics
    'dien thoai': ['phone', 'smartphone', 'mobile', 'iphone', 'android'],
    'may tinh':   ['computer', 'laptop', 'pc', 'notebook', 'macbook'],
    'tai nghe':   ['headphone', 'earphone', 'earbuds', 'headset'],
    // Cosmetics
    'son':       ['lipstick', 'gloss', 'balm'],
    'kem':       ['cream', 'lotion', 'moisturizer', 'sunscreen', 'serum'],
    'phan':      ['powder', 'foundation', 'blush', 'eyeshadow'],
    'nuoc hoa':  ['perfume', 'cologne', 'fragrance'],
    // Food
    'ca phe': ['coffee'],
    'tra':    ['tea'],
    'banh':   ['cake', 'cookie', 'bread', 'biscuit', 'snack'],
    // Home & Living
    'ghe': ['chair', 'sofa', 'couch', 'stool', 'bench'],
    'ban': ['table', 'desk'],
    'den': ['lamp', 'light', 'bulb'],
    // Sports
    'the thao': ['sport', 'fitness', 'gym', 'athletic', 'exercise'],
    'bong da':  ['football', 'soccer'],
    'bong ro':  ['basketball'],
    // Bags & Wallets
    'tui': ['bag', 'backpack', 'handbag', 'purse'],
    'vi':  ['wallet', 'purse'],
    // Watches & Jewelry
    'dong ho': ['watch', 'clock'],
    'nhan':    ['ring', 'jewelry'],
    'vong':    ['bracelet', 'necklace', 'bangle'],
  };

  // ---------------------------------------------------------------------------
  // tsquery Builder
  // ---------------------------------------------------------------------------

  /**
   * Converts a raw user keyword into a PostgreSQL tsquery string using:
   *  1. Tokenization: each word becomes an individual prefix-search token (word:*)
   *  2. Synonym expansion: Vietnamese → English equivalents added as OR terms
   *
   * Example:
   *   "Giày thể thao" → "giay:* | the:* | thao:* | shoe:* | sneaker:* | sport:* | ..."
   *
   * The resulting string is intended for use with to_tsquery('simple', ...).
   */
  buildTsQuery(rawKeyword: string): string {
    const normalized = this.normalizeSearchKeyword(rawKeyword);
    const wordSet = new Set<string>();

    // 1. Add each individual token from the user query
    normalized
      .split(/\s+/)
      .filter(t => t.length >= 2)
      .forEach(t => wordSet.add(t));

    // 2. Expand synonyms: check if normalized query contains any map key
    for (const [key, synonyms] of Object.entries(this.SYNONYM_MAP)) {
      const matched = normalized.includes(key) ||
        synonyms.some(s => normalized.includes(s));

      if (matched) {
        // Add key's individual tokens
        key.split(/\s+/).filter(w => w.length >= 2).forEach(w => wordSet.add(w));
        // Add all synonym tokens
        synonyms.forEach(s =>
          s.split(/\s+/).filter(w => w.length >= 2).forEach(w => wordSet.add(w))
        );
      }
    }

    if (wordSet.size === 0) {
      // Fallback: use the entire normalized string as a single prefix term
      return normalized.length >= 2 ? `${normalized}:*` : normalized;
    }

    // Build: "token1:* | token2:* | ..."
    return Array.from(wordSet)
      .map(w => `${w}:*`)
      .join(' | ');
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async findPublicProducts(query: QueryProductDto) {
    const normalizedQuery = { ...query };

    if (typeof query.search === 'string' && query.search.trim()) {
      // Replace raw user keyword with a ready-to-use PostgreSQL tsquery string
      normalizedQuery.search = this.buildTsQuery(query.search);
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

  async patchSellerProductStatus(sellerId: string, productId: string, status: 'Draft' | 'Hidden') {
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
