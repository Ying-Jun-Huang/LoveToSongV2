// file: love-to-song-backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Use validation for DTOs (if we define any) throughout the app
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
