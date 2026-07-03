import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Enable CORS cho frontend

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

  console.log(` [Backend] NestJS API is ready at: http://localhost:${port}`);
  console.log(` [Swagger] API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
