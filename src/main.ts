// Import polyfills first
import './polyfills';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { setupYjsWebSocketServer } from './yjs-websocket-server';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {seed} from './scripts/seed'
async function bootstrap() {
    await seed();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS - 允许所有来源
  app.enableCors({
    origin: true, // 允许所有来源
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = configService.get('PORT') || 3000;
  const wsPort = configService.get('WS_PORT') || 1234;
  const server = await app.listen(port);

  // Setup Yjs WebSocket server for collaborative editing
  setupYjsWebSocketServer(wsPort);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
