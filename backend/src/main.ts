import * as dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres:root@localhost:5432/ecommerce_TMN_db?schema=public';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Tích hợp Winston Logger làm Logger mặc định của NestJS
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Tăng cường bảo mật HTTP headers (NFR Security)
  app.use(helmet());

  // Bắt mọi exception và format bằng Tiếng Anh (NFR Error Handling & Logging)
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api');
  // Cấu hình CORS an toàn từ biến môi trường
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.BACKOFFICE_URL || 'http://localhost:3001'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Định dạng lại lỗi của class-validator thành dạng {"fields": { "property": "clean error message" }}
      exceptionFactory: (errors) => {
        const fields: Record<string, string> = {};
        errors.forEach((err) => {
          if (err.constraints) {
            const firstConstraintKey = Object.keys(err.constraints)[0];
            let cleanMessage = err.constraints[firstConstraintKey];
            
            // Loại bỏ tên thuộc tính ở đầu chuỗi (ví dụ: "email must be an email" -> "must be an email")
            const prefixRegex = new RegExp(`^${err.property}\\s+`, 'i');
            cleanMessage = cleanMessage.replace(prefixRegex, '');
            
            // Ánh xạ sang thông báo thân thiện hơn bằng Tiếng Anh
            if (cleanMessage.includes('must be an email')) {
              cleanMessage = 'Invalid email address';
            } else if (cleanMessage.includes('must not be empty') || cleanMessage.includes('should not be empty')) {
              cleanMessage = 'This field is required';
            } else if (cleanMessage.includes('must be longer than or equal to')) {
              const match = cleanMessage.match(/longer than or equal to (\d+)/);
              cleanMessage = `Must be at least ${match ? match[1] : '8'} characters`;
            } else if (cleanMessage.includes('must be shorter than or equal to')) {
              const match = cleanMessage.match(/shorter than or equal to (\d+)/);
              cleanMessage = `Must be at most ${match ? match[1] : '20'} characters`;
            } else if (cleanMessage.includes('must be a string')) {
              cleanMessage = 'Must be a text value';
            } else if (cleanMessage.includes('must be a number') || cleanMessage.includes('must be an integer')) {
              cleanMessage = 'Must be a numeric value';
            } else {
              // Viết hoa chữ cái đầu tiên
              cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
            }
            
            fields[err.property] = cleanMessage;
          }
        });
        return new BadRequestException({ fields });
      },
    }),
  );
  
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('E-commerce Marketplace API')
    .setDescription('The API documentation for the E-commerce Marketplace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`[Backend] NestJS API is ready at: http://localhost:${port}`);
  console.log(
    `[Swagger] API documentation is available at: http://localhost:${port}/api/docs`,
  );
}

void bootstrap();
