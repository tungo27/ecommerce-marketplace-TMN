import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    UploadModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    SellerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
