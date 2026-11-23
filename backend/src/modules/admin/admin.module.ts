import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, CacheInvalidationService],
})
export class AdminModule {}
