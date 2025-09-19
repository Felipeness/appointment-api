import { Injectable, Logger } from '@nestjs/common';
import {
  IdempotencyService,
  IdempotencyRecord,
} from '../interfaces/idempotency.interface';
import { createHash } from 'crypto';

@Injectable()
export class RedisIdempotencyService implements IdempotencyService {
  private readonly logger = new Logger(RedisIdempotencyService.name);
  private readonly cache = new Map<string, IdempotencyRecord>(); // In-memory implementation

  constructor() {}

  store(record: IdempotencyRecord): Promise<void> {
    const cacheKey = this.buildCacheKey(
      record.key,
      record.userId,
      record.endpoint,
    );

    this.cache.set(cacheKey, record);

    this.logger.debug(`Stored idempotency record`, {
      key: record.key,
      endpoint: record.endpoint,
      cacheKey,
    });

    return Promise.resolve();
  }

  get(
    key: string,
    userId?: string,
    endpoint?: string,
  ): Promise<IdempotencyRecord | null> {
    const cacheKey = this.buildCacheKey(key, userId, endpoint);
    const record = this.cache.get(cacheKey);

    if (record) {
      if (record.expiresAt.getTime() < Date.now()) {
        this.cache.delete(cacheKey);
        return Promise.resolve(null);
      }
      return Promise.resolve(record);
    }

    return Promise.resolve(null);
  }

  async exists(
    key: string,
    userId?: string,
    endpoint?: string,
  ): Promise<boolean> {
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

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.log(
        `Cleaned up ${expiredKeys.length} expired idempotency records`,
      );
    }

    // Satisfy ESLint require-await rule while maintaining async interface
    await Promise.resolve();
  }

  async validateParameters(
    key: string,
    parameters: Record<string, unknown>,
    userId?: string,
    endpoint?: string,
  ): Promise<boolean> {
    const record = await this.get(key, userId, endpoint);

    if (!record) {
      return true; // No existing record, parameters are valid
    }

    const currentHash = this.hashParameters(parameters);
    const storedHash = this.hashParameters(record.parameters);

    return currentHash === storedHash;
  }

  private buildCacheKey(
    key: string,
    userId?: string,
    endpoint?: string,
  ): string {
    const parts = ['idempotency', key];

    if (userId) {
      parts.push('user', userId);
    }

    if (endpoint) {
      parts.push('endpoint', endpoint.replace(/[^a-zA-Z0-9]/g, '_'));
    }

    return parts.join(':');
  }

  private hashParameters(parameters: Record<string, unknown>): string {
    // Create a consistent hash of parameters for comparison
    const sortedParams = JSON.stringify(
      parameters,
      Object.keys(parameters).sort(),
    );
    return createHash('sha256').update(sortedParams).digest('hex');
  }
}
