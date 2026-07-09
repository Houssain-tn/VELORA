import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { json, urlencoded } from 'express';

// BigInt serialization patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  // ── Startup Security Validation ──────────────────────────────────────────
  if (!process.env.JWT_SECRET) {
    logger.error('FATAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    logger.error('FATAL: JWT_REFRESH_SECRET environment variable is not set!');
    process.exit(1);
  }
  if (isProd && process.env.JWT_SECRET.length < 32) {
    logger.error('FATAL: JWT_SECRET is too short for production! Use at least 32 characters.');
    process.exit(1);
  }
  // ─────────────────────────────────────────────────────────────────────────

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Register WebSocket Adapter explicitly to force Socket.io server initialization
  app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));

  // Payload Limit Configuration
  // 1MB is sufficient for JSON payloads; file uploads use Multer
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  // Optimization & Performance
  app.use(compression());

  // CORS - Secure & LAN Friendly
  app.enableCors({
    origin: (origin, callback) => {
      // Development: allow localhost and LAN IPs
      if (!isProd) {
        if (
          !origin ||
          /https?:\/\/localhost|https?:\/\/127\.0\.0\.1|https?:\/\/192\.168\.|https?:\/\/10\.|https?:\/\/172\./.test(
            origin,
          )
        ) {
          callback(null, true);
          return;
        }
      }

      // Production: only allow explicitly configured origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : [];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Resiliency Core
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TimeoutInterceptor());

  // Static files (uploads)
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Swagger API Documentation — DISABLED in production to protect the API schema
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('VELORA PRO API')
      .setDescription('VELORA .. Smart Operations. Simplified')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentification et gestion des tokens')
      .addTag('Users', 'Gestion des utilisateurs')
      .addTag('Companies', 'Gestion des entreprises')
      .addTag('Contracts', 'Gestion des contrats et SLA')
      .addTag('Sites', 'Gestion des sites')
      .addTag('Equipment', 'Gestion des équipements')
      .addTag('Projects', 'Gestion des projets')
      .addTag('Tasks', 'Gestion des tâches')
      .addTag('Interventions', 'Gestion des interventions')
      .addTag('Comments', 'Commentaires')
      .addTag('Notifications', 'Notifications')
      .addTag('Documents', 'Documents et fichiers')
      .addTag('Analytics', 'KPIs et analytics')
      .addTag('Immobilisations', 'Gestion des immobilisations')
      .addTag('Parc Automobile', 'Gestion du parc automobile')
      .addTag('Moyens Généraux', 'Gestion des moyens généraux')
      .build();

    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`📖 Swagger API Docs: http://localhost:${process.env.PORT || 3333}/api/docs`);
  }

  const port = process.env.PORT || 3333;
  await app.listen(port, '0.0.0.0');
  logger.log(`\n🚀 VELORA PRO Backend running on: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);
}
bootstrap();
