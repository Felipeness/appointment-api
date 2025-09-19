import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly helmetMiddleware: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;

  constructor() {
    // Configure Helmet with security headers
    this.helmetMiddleware = helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
        },
      },

      // Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },

      // X-Frame-Options
      frameguard: {
        action: 'deny',
      },

      // X-Content-Type-Options
      noSniff: true,

      // X-XSS-Protection
      xssFilter: true,

      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },

      // Remove X-Powered-By header
      hidePoweredBy: true,

      // DNS Prefetch Control
      dnsPrefetchControl: {
        allow: false,
      },

      // Expect-CT removed as it's deprecated in Helmet v7+

      // Permission Policy
      permittedCrossDomainPolicies: false,
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Apply Helmet security headers
    this.helmetMiddleware(req, res, (err?: unknown) => {
      if (err) {
        this.logger.error('Helmet middleware error', err);
        return next(err);
      }

      // Add custom security headers
      this.addCustomSecurityHeaders(req, res);

      // Log security-related requests
      this.logSecurityEvents(req);

      next();
    });
  }

  private addCustomSecurityHeaders(req: Request, res: Response): void {
    // API-specific headers
    res.setHeader('X-API-Version', '1.0');
    res.setHeader(
      'X-Request-ID',
      req.headers['x-request-id'] ?? this.generateRequestId(),
    );

    // Cache control for sensitive endpoints
    if (this.isSensitiveEndpoint(req.path)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // CORS headers (if needed)
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Rate limiting info headers (will be set by rate limiter)
    res.setHeader('X-Rate-Limit-Policy', 'standard');

    // Security policy headers
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  }

  private logSecurityEvents(req: Request): void {
    const suspiciousIndicators = this.detectSuspiciousActivity(req);

    if (suspiciousIndicators.length > 0) {
      this.logger.warn('Suspicious request detected', {
        ip: this.getClientIP(req),
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        indicators: suspiciousIndicators,
        headers: this.sanitizeHeaders(
          req.headers as Record<string, string | string[]>,
        ),
      });
    }
  }

  private detectSuspiciousActivity(req: Request): string[] {
    const indicators: string[] = [];

    // Check for common attack patterns
    const path = req.path.toLowerCase();
    const userAgent = (req.headers['user-agent'] ?? '').toLowerCase();
    const query = JSON.stringify(req.query).toLowerCase();

    // SQL Injection patterns
    const sqlPatterns = [
      'union select',
      'drop table',
      'insert into',
      'delete from',
      'update set',
      "' or '1'='1",
      "' or 1=1",
      '-- ',
      '/*',
    ];

    if (
      sqlPatterns.some(
        (pattern) => path.includes(pattern) || query.includes(pattern),
      )
    ) {
      indicators.push('sql_injection_attempt');
    }

    // XSS patterns
    const xssPatterns = [
      '<script',
      'javascript:',
      'onerror=',
      'onload=',
      'eval(',
      'document.cookie',
    ];

    if (
      xssPatterns.some(
        (pattern) => path.includes(pattern) || query.includes(pattern),
      )
    ) {
      indicators.push('xss_attempt');
    }

    // Path traversal patterns
    const pathTraversalPatterns = [
      '../',
      '..\\',
      '/etc/passwd',
      '/etc/shadow',
      'windows/system32',
    ];

    if (pathTraversalPatterns.some((pattern) => path.includes(pattern))) {
      indicators.push('path_traversal_attempt');
    }

    // Common vulnerability scanners
    const scannerPatterns = [
      'nikto',
      'sqlmap',
      'nessus',
      'burp',
      'acunetix',
      'nmap',
      'masscan',
    ];

    if (scannerPatterns.some((pattern) => userAgent.includes(pattern))) {
      indicators.push('vulnerability_scanner');
    }

    // Unusual user agents
    const botPatterns = [
      'bot',
      'crawler',
      'spider',
      'scraper',
      'curl',
      'wget',
      'python-requests',
    ];

    if (
      !userAgent ||
      botPatterns.some((pattern) => userAgent.includes(pattern))
    ) {
      indicators.push('automated_request');
    }

    // Check for sensitive file access attempts
    const sensitiveFiles = [
      '.env',
      '.git',
      'config',
      'database',
      'admin',
      'wp-admin',
      'phpmyadmin',
      'backup',
      '.htaccess',
      'web.config',
    ];

    if (sensitiveFiles.some((file) => path.includes(file))) {
      indicators.push('sensitive_file_access');
    }

    // Large payload size
    const contentLength = parseInt(req.headers['content-length'] ?? '0');
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB
      indicators.push('large_payload');
    }

    // Unusual HTTP methods for API
    const unusualMethods = ['TRACE', 'OPTIONS', 'HEAD'];
    if (unusualMethods.includes(req.method)) {
      indicators.push('unusual_http_method');
    }

    return indicators;
  }

  private isSensitiveEndpoint(path: string): boolean {
    const sensitivePatterns = [
      '/auth',
      '/login',
      '/password',
      '/admin',
      '/user',
      '/profile',
      '/settings',
      '/api/v',
    ];

    return sensitivePatterns.some((pattern) => path.includes(pattern));
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      (req.headers['x-real-ip'] as string) ??
      req.connection.remoteAddress ??
      req.socket.remoteAddress ??
      req.ip ??
      'unknown'
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private sanitizeHeaders(
    headers: Record<string, string | string[]>,
  ): Record<string, string | string[]> {
    // Remove sensitive headers from logs
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'session-id',
    ];

    sensitiveHeaders.forEach((header) => {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
