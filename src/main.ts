import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { SimpleRateLimitMiddleware } from './common/middleware/simple-rate-limit.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import type { EnvConfig } from './infrastructure/config/env.validation';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig>);

  // Configure body parsing explicitly
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Get environment variables
  const nodeEnv = configService.get('NODE_ENV', { infer: true });
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  const port = configService.get('PORT', { infer: true });

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: nodeEnv === 'production' ? [] : null,
        },
      },
      hsts:
        nodeEnv === 'production'
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
      referrerPolicy: { policy: 'same-origin' },
    }),
  );

  // CORS configuration
  const corsOrigins = corsOrigin?.split(',').map((origin) => origin.trim()) ?? [
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: nodeEnv === 'production' ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-HTTP-Method-Override',
      'Accept',
      'Observe',
      'x-correlation-id',
      'Idempotency-Key',
    ],
  });

  // Correlation ID middleware (must be first for proper request tracing)
  app.use(
    new CorrelationIdMiddleware(configService).use.bind(
      new CorrelationIdMiddleware(configService),
    ),
  );

  // Idempotency middleware - disabled for now

  // Security middleware
  app.use(new SecurityMiddleware().use.bind(new SecurityMiddleware()));

  // Simple rate limiting middleware
  app.use(
    new SimpleRateLimitMiddleware().use.bind(new SimpleRateLimitMiddleware()),
  );

  // Global error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global correlation ID interceptor
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  // Enhanced Global validation with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for compatibility with Zod
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints ?? {});
          return `${error.property}: ${constraints.join(', ')}`;
        });
        return new Error(`Validation failed: ${messages.join('; ')}`);
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Appointment API')
    .setDescription(
      'Online Consultation Scheduling API with asynchronous processing',
    )
    .setVersion('1.0')
    .addTag('appointments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port ?? 3000);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`CORS Origins: ${corsOrigins.join(', ')}`);
}
void bootstrap();
