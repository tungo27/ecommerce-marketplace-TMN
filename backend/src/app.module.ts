import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UploadModule,
    ProductsModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
