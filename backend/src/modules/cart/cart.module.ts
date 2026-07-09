import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

/**
 * CartModule - Module quản lý toàn bộ tính năng giỏ hàng.
 *
 * Phụ thuộc:
 *  - PrismaModule: @Global() nên không cần import, nhưng để tường minh ta import.
 *  - RedisModule: Cung cấp REDIS_CLIENT token để CartService inject.
 */
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
