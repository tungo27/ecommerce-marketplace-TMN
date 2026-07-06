import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Khởi tạo Prisma Client mà không cần tham số, nó sẽ tự động đọc DATABASE_URL từ môi trường hệ thống
    super({
      log: ['info', 'warn', 'error'],
    });
  }

  // Tự động kết nối cơ sở dữ liệu khi Module được khởi tạo
  async onModuleInit() {
    await this.$connect();
    console.log('[PrismaService] Kết nối PostgreSQL thành công!');
  }

  // Tự động ngắt kết nối an toàn khi ứng dụng dừng (shutdown)
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[PrismaService] Đã ngắt kết nối PostgreSQL an toàn.');
  }
}