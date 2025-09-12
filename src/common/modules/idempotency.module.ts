import { Module } from '@nestjs/common';
import { RedisIdempotencyService } from '../services/idempotency.service';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@Module({
  providers: [
    {
      provide: 'IdempotencyService',
      useClass: RedisIdempotencyService,
    },
    IdempotencyInterceptor,
  ],
  exports: ['IdempotencyService', IdempotencyInterceptor],
})
export class IdempotencyModule {}
