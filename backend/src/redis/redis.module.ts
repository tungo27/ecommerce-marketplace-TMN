import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * REDIS_CLIENT - DI Token để inject ioredis instance vào các service.
 * Sử dụng string token thay vì class để tránh circular dependency.
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * RedisModule - Module cấu hình và cung cấp Redis client toàn cục.
 *
 * Biến môi trường:
 *  - REDIS_HOST: Hostname của Redis server (default: localhost)
 *  - REDIS_PORT: Port của Redis server (default: 6379)
 *  - REDIS_PASSWORD: Password (nếu có)
 *  - REDIS_DB: Database index (default: 0)
 *
 * Sử dụng @Global() để mọi module đều có thể inject REDIS_CLIENT
 * mà không cần import RedisModule riêng.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis => {
        const client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          // Tự động reconnect khi mất kết nối
          retryStrategy: (times: number) => {
            if (times > 10) {
              // Sau 10 lần thử, ngừng reconnect
              return null;
            }
            // Tăng dần thời gian chờ: 50ms, 100ms, 200ms, ... (tối đa 3000ms)
            return Math.min(times * 50, 3000);
          },
          // Timeout cho mỗi lệnh (10 giây)
          commandTimeout: 10000,
          // Số lần retry tối đa cho mỗi lệnh khi kết nối thất bại
          maxRetriesPerRequest: 3,
          // Bật lazy connect để không block startup nếu Redis chưa sẵn sàng
          lazyConnect: false,
          // Tên kết nối để debug
          connectionName: 'ecommerce-cart',
          // Enable TLS trong production
          tls:
            process.env.REDIS_TLS === 'true'
              ? { rejectUnauthorized: true }
              : undefined,
        });

        client.on('connect', () => {
          console.log('[RedisModule] Đã kết nối thành công đến Redis server.');
        });

        client.on('ready', () => {
          console.log('[RedisModule] Redis client sẵn sàng nhận lệnh.');
        });

        client.on('error', (error: Error) => {
          console.error('[RedisModule] Lỗi Redis:', error.message);
        });

        client.on('close', () => {
          console.warn('[RedisModule] Kết nối Redis đã đóng.');
        });

        client.on('reconnecting', (delay: number) => {
          console.log(
            `[RedisModule] Đang thử reconnect sau ${delay}ms...`,
          );
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
