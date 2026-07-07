import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['info', 'warn', 'error'],
    } as any);

    this.pool = pool;
  }

  // Tự động kết nối cơ sở dữ liệu khi Module được khởi tạo
  async onModuleInit() {
    await this.$connect();
    console.log('[PrismaService] Kết nối PostgreSQL thành công!');
  }

  // Tự động ngắt kết nối an toàn khi ứng dụng dừng (shutdown)
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    console.log('[PrismaService] Đã ngắt kết nối PostgreSQL an toàn.');
  }
}