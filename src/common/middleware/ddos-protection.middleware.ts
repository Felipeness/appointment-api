import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';

export interface DDoSProtectionConfig {
  // General settings
  enabled: boolean;
  
  // Rate limiting
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  
  // DDoS detection
  suspiciousThreshold: number; // Requests per minute to be considered suspicious
  attackThreshold: number; // Requests per minute to be considered attack
  
  // Progressive blocking
  warningThreshold: number; // When to start warning
  slowdownThreshold: number; // When to start slowing down responses
  
  // IP whitelist/blacklist
  whitelist: string[]; // IPs to never block
  blacklist: string[]; // IPs to always block
  
  // Response settings
  message: string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

@Injectable()
export class DDoSProtectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DDoSProtectionMiddleware.name);
  
  // Rate limiters for different scenarios
  private readonly generalLimiter: RateLimiterMemory;
  private readonly suspiciousLimiter: RateLimiterMemory;
  private readonly attackLimiter: RateLimiterMemory;
  
  // Tracking
  private readonly suspiciousIPs = new Set<string>();
  private readonly attackingIPs = new Set<string>();
  private readonly warningIPs = new Map<string, number>(); // IP -> warning count
  
  private readonly config: DDoSProtectionConfig;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute normally
      suspiciousThreshold: 200, // 200+ requests per minute is suspicious
      attackThreshold: 500, // 500+ requests per minute is attack
      warningThreshold: 50, // 50 requests per minute gets warning
      slowdownThreshold: 150, // 150+ requests per minute gets slowdown
      whitelist: [
        '127.0.0.1',
        '::1',
        'localhost',
        // Add monitoring/health check IPs here
      ],
      blacklist: [
        // Add known malicious IPs here
      ],
      message: 'Too many requests from this IP. Please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    };

    // Initialize rate limiters
    this.generalLimiter = new RateLimiterMemory({
      keyPrefix: 'ddos-general',
      points: this.config.maxRequests,
      duration: Math.floor(this.config.windowMs / 1000),
      blockDuration: Math.floor(this.config.windowMs / 1000) * 2, // Block for 2 windows
    });

    this.suspiciousLimiter = new RateLimiterMemory({
      keyPrefix: 'ddos-suspicious',
      points: this.config.suspiciousThreshold,
      duration: 60, // 1 minute
      blockDuration: 300, // Block for 5 minutes
    });

    this.attackLimiter = new RateLimiterMemory({
      keyPrefix: 'ddos-attack',
      points: this.config.attackThreshold,
      duration: 60, // 1 minute
      blockDuration: 3600, // Block for 1 hour
    });

    this.logger.log('DDoS Protection initialized', {
      enabled: this.config.enabled,
      maxRequests: this.config.maxRequests,
      windowMs: this.config.windowMs,
      suspiciousThreshold: this.config.suspiciousThreshold,
      attackThreshold: this.config.attackThreshold,
    });
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.config.enabled) {
      return next();
    }

    const clientIP = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const endpoint = req.path;
    
    try {
      // Check if IP is whitelisted
      if (this.isWhitelisted(clientIP)) {
        return next();
      }

      // Check if IP is blacklisted
      if (this.isBlacklisted(clientIP)) {
        this.logger.warn(`Blocked blacklisted IP: ${clientIP}`, {
          ip: clientIP,
          userAgent,
          endpoint,
        });
        return this.sendBlockedResponse(res, 'IP address is blocked');
      }

      // Check for ongoing attack from this IP
      if (this.attackingIPs.has(clientIP)) {
        this.logger.warn(`Blocked attacking IP: ${clientIP}`, {
          ip: clientIP,
          userAgent,
          endpoint,
        });
        return this.sendBlockedResponse(res, 'IP address is temporarily blocked due to suspicious activity');
      }

      // Progressive rate limiting
      await this.checkGeneralRateLimit(clientIP, req, res);
      await this.checkSuspiciousActivity(clientIP, req, res);
      await this.checkAttackPattern(clientIP, req, res);

      // Add security headers
      this.addSecurityHeaders(res);

      // Add request tracking
      this.trackRequest(clientIP, req);

      next();
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return; // Already handled by rate limit check
      }

      this.logger.error(`DDoS protection error for IP: ${clientIP}`, {
        error: error.message,
        stack: error.stack,
      });
      
      next(); // Continue on error to avoid blocking legitimate requests
    }
  }

  private async checkGeneralRateLimit(ip: string, req: Request, res: Response): Promise<void> {
    try {
      const limiterRes = await this.generalLimiter.consume(ip);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', limiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', Math.round(limiterRes.msBeforeNext / 1000));

      // Warning for high usage
      if (limiterRes.remainingPoints < this.config.warningThreshold) {
        this.warningIPs.set(ip, (this.warningIPs.get(ip) || 0) + 1);
        
        this.logger.warn(`High request rate from IP: ${ip}`, {
          ip,
          remaining: limiterRes.remainingPoints,
          endpoint: req.path,
          userAgent: req.headers['user-agent'],
        });
      }

    } catch (rejRes) {
      if (rejRes instanceof RateLimiterRes) {
        this.logger.warn(`Rate limit exceeded for IP: ${ip}`, {
          ip,
          endpoint: req.path,
          msBeforeNext: rejRes.msBeforeNext,
        });

        res.setHeader('Retry-After', Math.round(rejRes.msBeforeNext / 1000));
        this.sendRateLimitResponse(res, rejRes);
        throw rejRes;
      }
      throw rejRes;
    }
  }

  private async checkSuspiciousActivity(ip: string, req: Request, res: Response): Promise<void> {
    try {
      await this.suspiciousLimiter.consume(ip);
    } catch (rejRes) {
      if (rejRes instanceof RateLimiterRes) {
        this.suspiciousIPs.add(ip);
        
        this.logger.warn(`Suspicious activity detected from IP: ${ip}`, {
          ip,
          endpoint: req.path,
          userAgent: req.headers['user-agent'],
          requestCount: this.config.suspiciousThreshold,
        });

        // More restrictive rate limiting for suspicious IPs
        res.setHeader('X-Suspicious-Activity', 'true');
        this.sendRateLimitResponse(res, rejRes, 'Suspicious activity detected');
        throw rejRes;
      }
      throw rejRes;
    }
  }

  private async checkAttackPattern(ip: string, req: Request, res: Response): Promise<void> {
    try {
      await this.attackLimiter.consume(ip);
    } catch (rejRes) {
      if (rejRes instanceof RateLimiterRes) {
        this.attackingIPs.add(ip);
        
        this.logger.error(`DDoS attack pattern detected from IP: ${ip}`, {
          ip,
          endpoint: req.path,
          userAgent: req.headers['user-agent'],
          requestCount: this.config.attackThreshold,
          blockDuration: rejRes.msBeforeNext,
        });

        // Alert monitoring systems
        this.alertAttack(ip, req);

        res.setHeader('X-Attack-Detected', 'true');
        this.sendRateLimitResponse(res, rejRes, 'DDoS attack detected - IP temporarily blocked');
        throw rejRes;
      }
      throw rejRes;
    }
  }

  private trackRequest(ip: string, req: Request): void {
    // Track request patterns for analysis
    const timestamp = Date.now();
    const requestData = {
      ip,
      timestamp,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      contentLength: req.headers['content-length'],
    };

    // Log suspicious patterns
    if (this.isRequestSuspicious(req)) {
      this.logger.warn(`Suspicious request pattern detected`, requestData);
    }
  }

  private isRequestSuspicious(req: Request): boolean {
    const userAgent = req.headers['user-agent'] || '';
    const path = req.path;
    
    // Check for common attack patterns
    const suspiciousPatterns = [
      /bot|crawler|spider/i,
      /curl|wget|python/i,
      /scanner|nikto|sqlmap/i,
    ];

    const suspiciousPaths = [
      /\/\.env/,
      /\/admin/,
      /\/wp-admin/,
      /\/phpmyadmin/,
      /\.(php|asp|jsp)$/,
    ];

    const contentLength = req.headers['content-length'];
    return (
      suspiciousPatterns.some(pattern => pattern.test(userAgent)) ||
      suspiciousPaths.some(pattern => pattern.test(path)) ||
      (contentLength !== undefined && parseInt(contentLength) > 10000000) // 10MB+
    );
  }

  private isWhitelisted(ip: string): boolean {
    return this.config.whitelist.includes(ip) || this.isLocalIP(ip);
  }

  private isBlacklisted(ip: string): boolean {
    return this.config.blacklist.includes(ip);
  }

  private isLocalIP(ip: string): boolean {
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || false;
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  private addSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  private sendRateLimitResponse(res: Response, rejRes: RateLimiterRes, customMessage?: string): void {
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: customMessage || this.config.message,
      error: 'Too Many Requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
      remainingHits: rejRes.remainingPoints || 0,
    });
  }

  private sendBlockedResponse(res: Response, message: string): void {
    res.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      message,
      error: 'Forbidden',
    });
  }

  private alertAttack(ip: string, req: Request): void {
    // TODO: Integrate with monitoring/alerting system
    // Examples:
    // - Send to Slack/Discord webhook
    // - Send email alert
    // - Log to security monitoring system
    // - Update firewall rules automatically
    
    this.logger.error(`🚨 DDoS ATTACK ALERT 🚨`, {
      attackerIP: ip,
      timestamp: new Date().toISOString(),
      endpoint: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      severity: 'HIGH',
      action: 'IP_BLOCKED',
    });
  }

  // Public methods for monitoring/management
  public getStats(): {
    suspiciousIPs: number;
    attackingIPs: number;
    warningIPs: number;
    config: DDoSProtectionConfig;
  } {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      attackingIPs: this.attackingIPs.size,
      warningIPs: this.warningIPs.size,
      config: this.config,
    };
  }

  public clearIP(ip: string): void {
    this.suspiciousIPs.delete(ip);
    this.attackingIPs.delete(ip);
    this.warningIPs.delete(ip);
    this.logger.log(`Cleared restrictions for IP: ${ip}`);
  }

  public addToWhitelist(ip: string): void {
    this.config.whitelist.push(ip);
    this.clearIP(ip);
    this.logger.log(`Added IP to whitelist: ${ip}`);
  }

  public addToBlacklist(ip: string): void {
    this.config.blacklist.push(ip);
    this.logger.log(`Added IP to blacklist: ${ip}`);
  }
}