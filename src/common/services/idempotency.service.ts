import { Injectable, Logger } from '@nestjs/common';
import { IdempotencyService, IdempotencyRecord } from '../interfaces/idempotency.interface';
import { createHash } from 'crypto';

@Injectable()
export class RedisIdempotencyService implements IdempotencyService {
  private readonly logger = new Logger(RedisIdempotencyService.name);
  private readonly cache = new Map<string, IdempotencyRecord>(); // In-memory fallback

  constructor(
    // @Inject('REDIS_CLIENT') private readonly redis: Redis, // Uncomment when Redis is available
  ) {}

  async store(record: IdempotencyRecord): Promise<void> {
    const cacheKey = this.buildCacheKey(record.key, record.userId, record.endpoint);
    
    try {
      // TODO: Use Redis when available
      // await this.redis.setex(cacheKey, Math.floor((record.expiresAt.getTime() - Date.now()) / 1000), JSON.stringify(record));
      
      // Fallback to in-memory cache
      this.cache.set(cacheKey, record);
      
      this.logger.debug(`Stored idempotency record`, {
        key: record.key,
        endpoint: record.endpoint,
        cacheKey,
      });
    } catch (error) {
      this.logger.error(`Failed to store idempotency record`, {
        key: record.key,
        error: error.message,
      });
      throw error;
    }
  }

  async get(key: string, userId?: string, endpoint?: string): Promise<IdempotencyRecord | null> {
    const cacheKey = this.buildCacheKey(key, userId, endpoint);
    
    try {
      // TODO: Use Redis when available
      // const data = await this.redis.get(cacheKey);
      // if (data) {
      //   const record = JSON.parse(data) as IdempotencyRecord;
      //   record.createdAt = new Date(record.createdAt);
      //   record.expiresAt = new Date(record.expiresAt);
      //   return record;
      // }
      
      // Fallback to in-memory cache
      const record = this.cache.get(cacheKey);
      if (record) {
        // Check expiration
        if (record.expiresAt.getTime() < Date.now()) {
          this.cache.delete(cacheKey);
          return null;
        }
        return record;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to get idempotency record`, {
        key,
        error: error.message,
      });
      return null;
    }
  }

  async exists(key: string, userId?: string, endpoint?: string): Promise<boolean> {
    const record = await this.get(key, userId, endpoint);
    return record !== null;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Clean up in-memory cache
    for (const [cacheKey, record] of this.cache.entries()) {
      if (record.expiresAt.getTime() < now) {
        expiredKeys.push(cacheKey);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.logger.log(`Cleaned up ${expiredKeys.length} expired idempotency records`);
    }
  }

  async validateParameters(
    key: string,
    parameters: Record<string, any>,
    userId?: string,
    endpoint?: string
  ): Promise<boolean> {
    const record = await this.get(key, userId, endpoint);
    
    if (!record) {
      return true; // No existing record, parameters are valid
    }
    
    const currentHash = this.hashParameters(parameters);
    const storedHash = this.hashParameters(record.parameters);
    
    return currentHash === storedHash;
  }

  private buildCacheKey(key: string, userId?: string, endpoint?: string): string {
    const parts = ['idempotency', key];
    
    if (userId) {
      parts.push('user', userId);
    }
    
    if (endpoint) {
      parts.push('endpoint', endpoint.replace(/[^a-zA-Z0-9]/g, '_'));
    }
    
    return parts.join(':');
  }

  private hashParameters(parameters: Record<string, any>): string {
    // Create a consistent hash of parameters for comparison
    const sortedParams = JSON.stringify(parameters, Object.keys(parameters).sort());
    return createHash('sha256').update(sortedParams).digest('hex');
  }
}