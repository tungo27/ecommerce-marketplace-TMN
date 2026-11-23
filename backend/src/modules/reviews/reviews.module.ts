import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, CacheInvalidationService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
