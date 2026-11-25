import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

import { PrismaModule } from '../../prisma/prisma.module';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';

@Module({
  imports: [PrismaModule],
  providers: [CategoriesService, CacheInvalidationService],
  controllers: [CategoriesController],
  exports: [CategoriesService]
})
export class CategoriesModule {}
