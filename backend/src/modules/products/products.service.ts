import { Injectable } from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import { QueryProductDto } from './dtos/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findPublicProducts(query: QueryProductDto) {
    return this.productRepository.findPublicProducts(query);
  }
}
