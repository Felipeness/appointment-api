import { Module } from '@nestjs/common';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { DDoSProtectionMiddleware } from '../middleware/ddos-protection.middleware';
import { SecurityMiddleware } from '../middleware/security.middleware';
import { SecurityController } from '../../presentation/controllers/security.controller';
import { SQSIdempotencyService } from '../services/sqs-idempotency.service';

@Module({
  providers: [
    RateLimitGuard,
    DDoSProtectionMiddleware,
    SecurityMiddleware,
    SQSIdempotencyService,
  ],
  controllers: [SecurityController],
  exports: [
    RateLimitGuard,
    DDoSProtectionMiddleware,
    SecurityMiddleware,
    SQSIdempotencyService,
  ],
})
export class SecurityModule {}
