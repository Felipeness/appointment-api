import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { DDoSProtectionMiddleware } from './common/middleware/ddos-protection.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Security middleware (must be first)
  app.use(new SecurityMiddleware().use.bind(new SecurityMiddleware()));

  // DDoS protection middleware
  app.use(
    new DDoSProtectionMiddleware().use.bind(new DDoSProtectionMiddleware()),
  );

  // Global error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global correlation ID interceptor
  app.useGlobalInterceptors(new CorrelationIdInterceptor());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);
}
void bootstrap();
