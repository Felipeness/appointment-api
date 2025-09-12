import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import Redis from 'redis';
import { EnvConfig } from '../../infrastructure/config/env.validation';

export interface RequestWithIdempotency extends Request {
  idempotencyKey?: string;
}

interface CachedResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly redis: Redis.RedisClientType;
  private readonly IDEMPOTENCY_TTL = 86400; // 24 hours

  constructor(private readonly configService: ConfigService<EnvConfig>) {
    const redisHost = this.configService.get('REDIS_HOST', { infer: true });
    const redisPort = this.configService.get('REDIS_PORT', { infer: true });
    const redisPassword = this.configService.get('REDIS_PASSWORD', {
      infer: true,
    });

    this.redis = Redis.createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword,
    });

    this.redis.connect().catch(console.error);
  }

  async use(
    req: RequestWithIdempotency,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // Only apply idempotency to non-safe methods
    if (
      req.method === 'GET' ||
      req.method === 'HEAD' ||
      req.method === 'OPTIONS'
    ) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next();
    }

    // Validate idempotency key format (UUID v4)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Invalid idempotency key format. Must be a valid UUID v4.',
        code: 'INVALID_IDEMPOTENCY_KEY',
      });
      return;
    }

    req.idempotencyKey = idempotencyKey;

    try {
      // Check if we have a cached response
      const cacheKey = `idempotency:${idempotencyKey}:${req.method}:${req.path}`;
      const cachedResponseStr = await this.redis.get(cacheKey);

      if (cachedResponseStr) {
        const cachedResponse: CachedResponse = JSON.parse(cachedResponseStr);

        // Set cached headers
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Add idempotency replay header
        res.setHeader('X-Idempotency-Replay', 'true');

        res.status(cachedResponse.statusCode).json(cachedResponse.body);
        return;
      }

      // Intercept response to cache it
      const originalSend = res.send;
      const originalJson = res.json;
      let responseBody: any;
      let responseHeaders: Record<string, string> = {};

      // Override json method
      res.json = function (body: any) {
        responseBody = body;
        responseHeaders = this.getHeaders() as Record<string, string>;
        return originalJson.call(this, body);
      };

      // Override send method
      res.send = function (body: any) {
        responseBody = body;
        responseHeaders = this.getHeaders() as Record<string, string>;
        return originalSend.call(this, body);
      };

      // Continue to next middleware
      next();

      // Cache successful responses (2xx status codes)
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
          const cachedResponse: CachedResponse = {
            statusCode: res.statusCode,
            body: responseBody,
            headers: responseHeaders,
            timestamp: Date.now(),
          };

          try {
            await this.redis.setEx(
              cacheKey,
              this.IDEMPOTENCY_TTL,
              JSON.stringify(cachedResponse),
            );
          } catch (error) {
            console.error('Failed to cache idempotent response:', error);
          }
        }
      });
    } catch (error) {
      console.error('Idempotency middleware error:', error);
      // Continue without idempotency if Redis fails
      next();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
