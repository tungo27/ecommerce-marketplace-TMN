import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UploadModule } from './upload/upload.module';
import { SellerModule } from './modules/seller/seller.module';
import { AdminModule } from './modules/admin/admin.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CmsModule } from './modules/cms/cms.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { FlashSalesModule } from './modules/flash-sales/flash-sales.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    HealthModule,
    // Tích hợp Rate Limiting (giới hạn 100 request/phút trên toàn hệ thống)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 300, // 300 requests/minute - balanced between DDoS protection and normal browsing
    }]),
    // Tích hợp Cache với Redis cho Performance
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          ttl: 5000,
        });
        return { store } as any;
      },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UploadModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    SellerModule,
    AdminModule,
    CategoriesModule,
    CmsModule,
    DisputesModule,
    FlashSalesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Kích hoạt Guard Rate Limit global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
