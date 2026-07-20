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
      .replace(/đ/g, 'd').replace(/Đ/g, 'D') // handle Vietnamese d
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
    'ao':   ['shirt', 'blouse', 'hoodie', 'sweater', 'polo', 'tshirt', 'jacket'],
    'quan': ['pant', 'trouser', 'jeans', 'shorts', 'legging'],
    'vay':  ['dress', 'skirt'],
    // Clothing — multi-word phrases (normalized, no diacritics)
    'ao khoac': ['jacket', 'coat', 'hoodie', 'cardigan'],
    'ao phong':  ['tshirt', 'polo'],
    // Electronics
    'dien thoai': ['phone', 'smartphone', 'mobile', 'iphone', 'android'],
    'may tinh':   ['computer', 'laptop', 'desktop', 'notebook', 'macbook'],
    'tai nghe':   ['headphone', 'earphone', 'earbuds', 'headset'],
    // Cosmetics
    'son':       ['lipstick', 'lipgloss', 'lipbalm'],
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
    'den': ['lamp', 'lighting', 'bulb'],
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
    let normalized = this.normalizeSearchKeyword(rawKeyword);
    const groups: string[] = [];

    // Sort keys by length descending to match longest phrases first (e.g. 'ao khoac' before 'ao')
    const sortedKeys = Object.keys(this.SYNONYM_MAP).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const synonyms = this.SYNONYM_MAP[key];
      // All possible phrases to match for this group (key + synonyms), sorted by length descending
      const allPhrases = [key, ...synonyms].sort((a, b) => b.length - a.length);

      let paddedNormalized = ` ${normalized} `;
      let matchedPhrase: string | null = null;

      for (const phrase of allPhrases) {
        if (paddedNormalized.includes(` ${phrase} `)) {
          matchedPhrase = phrase;
          break;
        }
      }

      if (matchedPhrase) {
        const formatToken = (t: string) => t.length >= 4 ? `${t}:*` : t;

        // Build the tsquery group for this entire concept
        const keyTokens = key.split(/\s+/).filter(t => t.length > 0).map(formatToken).join(' & ');
        const synQueries = synonyms.map(syn => {
          const sTokens = syn.split(/\s+/).filter(t => t.length > 0).map(formatToken).join(' & ');
          return sTokens ? `(${sTokens})` : null;
        }).filter(Boolean);
        
        const groupQuery = `((${keyTokens})` + (synQueries.length > 0 ? ` | ${synQueries.join(' | ')}` : '') + `)`;
        groups.push(groupQuery);

        // Remove ONLY the matched phrase from the normalized string so it's not processed again as remaining tokens
        paddedNormalized = paddedNormalized.replace(` ${matchedPhrase} `, ' ');
        normalized = paddedNormalized.trim().replace(/\s+/g, ' ');
      }
    }

    // Process remaining words
    const formatToken = (t: string) => t.length >= 4 ? `${t}:*` : t;
    const remainingTokens = normalized.split(/\s+/).filter(t => t.length > 0);
    for (const token of remainingTokens) {
      groups.push(formatToken(token));
    }

    if (groups.length === 0) {
      // Fallback: If normalized only contained spaces (empty)
      return "";
    }

    return groups.join(' & ');
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
      (dto.categoryId !== undefined && dto.categoryId !== product.categoryId);

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
    if (dto.categoryId !== undefined) {
      updateData.categoryId = dto.categoryId;
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
        categoryId: dto.categoryId,
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
    return { products: data, meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit } };
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
