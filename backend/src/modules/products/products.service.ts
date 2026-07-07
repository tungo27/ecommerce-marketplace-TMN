import { Injectable } from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { QueryProductDto } from './dtos/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: ProductRepository) {}

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
}