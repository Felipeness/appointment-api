import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message: string;
  whitelist: string[]; // IPs to never limit
}

@Injectable()
export class SimpleRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SimpleRateLimitMiddleware.name);
  private readonly rateLimiter: RateLimiterMemory;
  private readonly config: RateLimitConfig;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: 'Too many requests from this IP. Please try again later.',
      whitelist: [
        '127.0.0.1',
        '::1',
        'localhost',
        // Add your monitoring/health check IPs here
      ],
    };

    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: 'rate-limit',
      points: this.config.maxRequests,
      duration: Math.floor(this.config.windowMs / 1000),
      blockDuration: Math.floor(this.config.windowMs / 1000), // Block for same duration
    });

    this.logger.log('Simple rate limiting initialized', {
      enabled: this.config.enabled,
      maxRequests: this.config.maxRequests,
      windowMs: this.config.windowMs,
    });
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.config.enabled) {
      return next();
    }

    const clientIP = this.getClientIP(req);

    try {
      // Check if IP is whitelisted
      if (this.isWhitelisted(clientIP)) {
        return next();
      }

      // Apply rate limiting
      const limiterRes = await this.rateLimiter.consume(clientIP);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', limiterRes.remainingPoints);
      res.setHeader(
        'X-RateLimit-Reset',
        Math.round(limiterRes.msBeforeNext / 1000),
      );

      next();
    } catch (rejRes) {
      if (rejRes instanceof RateLimiterRes) {
        this.logger.warn(`Rate limit exceeded for IP: ${clientIP}`, {
          ip: clientIP,
          endpoint: req.path,
          msBeforeNext: rejRes.msBeforeNext,
        });

        res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: this.config.message,
          error: 'Too Many Requests',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000),
        });
        return;
      }

      this.logger.error(`Rate limiting error for IP: ${clientIP}`, {
        error: rejRes instanceof Error ? rejRes.message : String(rejRes),
      });

      next(); // Continue on error to avoid blocking legitimate requests
    }
  }

  private isWhitelisted(ip: string): boolean {
    return this.config.whitelist.includes(ip) || this.isLocalIP(ip);
  }

  private isLocalIP(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.') ||
      false
    );
  }

  private getClientIP(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
    }

    if (typeof realIp === 'string') {
      return realIp;
    }

    return (
      req.connection.remoteAddress ??
      req.socket.remoteAddress ??
      req.ip ??
      'unknown'
    );
  }

  // Public methods for monitoring
  public getStats(): { config: RateLimitConfig } {
    return { config: this.config };
  }

  public addToWhitelist(ip: string): void {
    this.config.whitelist.push(ip);
    this.logger.log(`Added IP to whitelist: ${ip}`);
  }
}
