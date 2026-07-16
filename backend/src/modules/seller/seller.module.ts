import { Module } from '@nestjs/common';
import { SellerController } from '../seller/seller.controller';
import { SellerService } from '../seller/seller.service';

@Module({
  controllers: [SellerController],
  providers: [SellerService],
})
export class SellerModule {}
