import { Module } from '@nestjs/common';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { SimpleRateLimitMiddleware } from '../middleware/simple-rate-limit.middleware';
import { SecurityMiddleware } from '../middleware/security.middleware';
import { SecurityController } from '../../presentation/controllers/security.controller';
import { SQSIdempotencyService } from '../services/sqs-idempotency.service';

@Module({
  providers: [
    RateLimitGuard,
    SimpleRateLimitMiddleware,
    SecurityMiddleware,
    SQSIdempotencyService,
  ],
  controllers: [SecurityController],
  exports: [
    RateLimitGuard,
    SimpleRateLimitMiddleware,
    SecurityMiddleware,
    SQSIdempotencyService,
  ],
})
export class SecurityModule {}
