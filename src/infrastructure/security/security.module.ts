import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: Number(configService.get('RATE_LIMIT_TTL', 60)) * 1000, // ms
            limit: Number(configService.get('RATE_LIMIT_MAX', 100)),
          },
          {
            name: 'medium',
            ttl: 300 * 1000, // 5 minutes
            limit: 1000,
          },
          {
            name: 'long',
            ttl: 3600 * 1000, // 1 hour
            limit: 5000,
          },
        ],
        // Use default in-memory storage for simplicity
        // In production, consider using Redis storage with ThrottlerStorageRedisService
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class SecurityModule {}
