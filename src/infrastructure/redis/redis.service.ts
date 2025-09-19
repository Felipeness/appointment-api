import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis-core.module';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.connect();
      this.logger.log('✅ Redis connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('🔌 Redis connection closed');
    } catch (error) {
      this.logger.error('❌ Error closing Redis connection', error);
    }
  }

  // Generic Redis operations
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds) {
      return this.redis.setex(key, ttlSeconds, value);
    }
    return this.redis.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.redis.setex(key, seconds, value);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async flushall(): Promise<'OK'> {
    return this.redis.flushall();
  }

  // JSON operations
  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async setObject<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<'OK'> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, field, value);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.redis.hdel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  // Health check
  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
