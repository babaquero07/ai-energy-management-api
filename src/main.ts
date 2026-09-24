import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { Logger } from '@nestjs/common';

const PORT = process.env.PORT ?? 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  await app.listen(PORT, '127.0.0.1');

  Logger.log(`API escuchando en http://localhost:${PORT}/api`, 'Bootstrap');
}

void bootstrap();
