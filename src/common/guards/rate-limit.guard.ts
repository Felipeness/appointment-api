import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RateLimiterMemory, RateLimiterRedis, IRateLimiterOptions, RateLimiterRes } from 'rate-limiter-flexible';

export interface RateLimitOptions {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block for duration in seconds (default: duration)
  keyPrefix?: string; // Prefix for the key
  skipSuccessfulRequests?: boolean; // Skip successful requests
  skipFailedRequests?: boolean; // Skip failed requests
}

export const RATE_LIMIT_KEY = 'rate-limit';

export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly rateLimiters = new Map<string, RateLimiterMemory | RateLimiterRedis>();
  
  constructor(
    private readonly reflector: Reflector,
    // @Inject('REDIS_CLIENT') private readonly redis?: Redis, // Uncomment when Redis is available
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, rateLimitOptions.keyPrefix);
    
    const rateLimiter = this.getRateLimiter(rateLimitOptions);

    try {
      await rateLimiter.consume(key);
      return true;
    } catch (rejRes) {
      if (rejRes instanceof RateLimiterRes) {
        const response = context.switchToHttp().getResponse();
        
        // Add rate limit headers
        response.setHeader('X-RateLimit-Limit', rateLimitOptions.points);
        response.setHeader('X-RateLimit-Remaining', rejRes.remainingPoints);
        response.setHeader('X-RateLimit-Reset', Math.round(rejRes.msBeforeNext / 1000));
        response.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));

        this.logger.warn(`Rate limit exceeded for key: ${key}`, {
          ip: this.getClientIP(request),
          userAgent: request.headers['user-agent'],
          endpoint: request.path,
          remainingHits: rejRes.remainingPoints,
          msBeforeNext: rejRes.msBeforeNext,
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later',
            error: 'Too Many Requests',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.error(`Rate limiter error for key: ${key}`, rejRes);
      return true; // Allow request if rate limiter fails
    }
  }

  private getRateLimiter(options: RateLimitOptions): RateLimiterMemory | RateLimiterRedis {
    const keyId = JSON.stringify(options);
    
    if (!this.rateLimiters.has(keyId)) {
      const rateLimiterOptions: IRateLimiterOptions = {
        points: options.points,
        duration: options.duration,
        blockDuration: options.blockDuration || options.duration,
        keyPrefix: options.keyPrefix || 'rate-limit',
      };

      // TODO: Use Redis when available
      // if (this.redis) {
      //   const rateLimiter = new RateLimiterRedis({
      //     storeClient: this.redis,
      //     ...rateLimiterOptions,
      //   });
      //   this.rateLimiters.set(keyId, rateLimiter);
      // } else {
      const rateLimiter = new RateLimiterMemory(rateLimiterOptions);
      this.rateLimiters.set(keyId, rateLimiter);
      // }
    }

    return this.rateLimiters.get(keyId)!;
  }

  private generateKey(request: Request, keyPrefix?: string): string {
    const ip = this.getClientIP(request);
    const userId = (request as any).user?.id;
    const endpoint = request.path;

    const parts = [keyPrefix || 'rate-limit', ip];
    
    if (userId) {
      parts.push('user', userId);
    }
    
    parts.push('endpoint', endpoint.replace(/[^a-zA-Z0-9]/g, '_'));

    return parts.join(':');
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}