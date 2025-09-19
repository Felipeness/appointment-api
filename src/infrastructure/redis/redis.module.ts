import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisCoreModule, REDIS_CLIENT } from './redis-core.module';

@Module({
  imports: [RedisCoreModule],
  providers: [RedisService],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
