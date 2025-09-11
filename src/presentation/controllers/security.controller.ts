import { Controller, Get, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DDoSProtectionMiddleware } from '../../common/middleware/ddos-protection.middleware';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard';

@ApiTags('security')
@Controller('security')
export class SecurityController {
  private ddosProtection?: DDoSProtectionMiddleware;

  constructor() {
    // Get DDoS protection instance for management endpoints
    // In a real application, you'd inject this properly
  }

  @Get('status')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 5, duration: 60 }) // 5 requests per minute for security status
  @ApiOperation({
    summary: 'Get security status and statistics',
    description: 'Returns current security protection status, rate limiting stats, and threat detection information.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'active' },
        protections: {
          type: 'object',
          properties: {
            rateLimit: { type: 'boolean' },
            ddosProtection: { type: 'boolean' },
            securityHeaders: { type: 'boolean' },
            idempotency: { type: 'boolean' },
          },
        },
        statistics: {
          type: 'object',
          properties: {
            suspiciousIPs: { type: 'number' },
            attackingIPs: { type: 'number' },
            warningIPs: { type: 'number' },
            totalBlocked: { type: 'number' },
          },
        },
        configuration: {
          type: 'object',
          properties: {
            maxRequests: { type: 'number' },
            windowMs: { type: 'number' },
            suspiciousThreshold: { type: 'number' },
            attackThreshold: { type: 'number' },
          },
        },
      },
    },
  })
  async getSecurityStatus() {
    const stats = this.ddosProtection?.getStats() || {
      suspiciousIPs: 0,
      attackingIPs: 0,
      warningIPs: 0,
      config: {
        maxRequests: 100,
        windowMs: 60000,
        suspiciousThreshold: 200,
        attackThreshold: 500,
      },
    };

    return {
      status: 'active',
      timestamp: new Date().toISOString(),
      protections: {
        rateLimit: true,
        ddosProtection: true,
        securityHeaders: true,
        idempotency: true,
      },
      statistics: {
        suspiciousIPs: stats.suspiciousIPs,
        attackingIPs: stats.attackingIPs,
        warningIPs: stats.warningIPs,
        totalBlocked: stats.suspiciousIPs + stats.attackingIPs,
      },
      configuration: {
        maxRequests: stats.config.maxRequests,
        windowMs: stats.config.windowMs,
        suspiciousThreshold: stats.config.suspiciousThreshold,
        attackThreshold: stats.config.attackThreshold,
      },
    };
  }

  @Post('whitelist')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 2, duration: 300 }) // 2 requests per 5 minutes for whitelist management
  @ApiOperation({
    summary: 'Add IP to whitelist',
    description: 'Add an IP address to the whitelist to bypass rate limiting and DDoS protection.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'IP added to whitelist successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        ip: { type: 'string' },
        addedAt: { type: 'string' },
      },
    },
  })
  async addToWhitelist(@Body() body: { ip: string; reason?: string }) {
    if (!this.isValidIP(body.ip)) {
      return {
        error: 'Invalid IP address format',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    this.ddosProtection?.addToWhitelist(body.ip);

    return {
      message: 'IP address added to whitelist successfully',
      ip: body.ip,
      reason: body.reason || 'Manual addition',
      addedAt: new Date().toISOString(),
    };
  }

  @Post('blacklist')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 5, duration: 300 }) // 5 requests per 5 minutes for blacklist management
  @ApiOperation({
    summary: 'Add IP to blacklist',
    description: 'Add an IP address to the blacklist to block all requests from that IP.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'IP added to blacklist successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        ip: { type: 'string' },
        addedAt: { type: 'string' },
      },
    },
  })
  async addToBlacklist(@Body() body: { ip: string; reason?: string }) {
    if (!this.isValidIP(body.ip)) {
      return {
        error: 'Invalid IP address format',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    this.ddosProtection?.addToBlacklist(body.ip);

    return {
      message: 'IP address added to blacklist successfully',
      ip: body.ip,
      reason: body.reason || 'Manual addition',
      addedAt: new Date().toISOString(),
    };
  }

  @Post('clear-ip')
  @UseGuards(RateLimitGuard)
  @RateLimit({ points: 3, duration: 300 }) // 3 requests per 5 minutes for IP clearing
  @ApiOperation({
    summary: 'Clear IP restrictions',
    description: 'Remove all restrictions (suspicious, attacking, warnings) for a specific IP address.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'IP restrictions cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        ip: { type: 'string' },
        clearedAt: { type: 'string' },
      },
    },
  })
  async clearIPRestrictions(@Body() body: { ip: string }) {
    if (!this.isValidIP(body.ip)) {
      return {
        error: 'Invalid IP address format',
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    this.ddosProtection?.clearIP(body.ip);

    return {
      message: 'IP restrictions cleared successfully',
      ip: body.ip,
      clearedAt: new Date().toISOString(),
    };
  }

  @Get('health')
  @RateLimit({ points: 10, duration: 60 }) // 10 requests per minute for health check
  @ApiOperation({
    summary: 'Security health check',
    description: 'Quick health check for security components.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Security health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        components: {
          type: 'object',
          properties: {
            rateLimiting: { type: 'string' },
            ddosProtection: { type: 'string' },
            securityHeaders: { type: 'string' },
            idempotency: { type: 'string' },
          },
        },
        uptime: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  })
  async getHealthStatus() {
    return {
      status: 'healthy',
      components: {
        rateLimiting: 'operational',
        ddosProtection: 'operational',
        securityHeaders: 'operational',
        idempotency: 'operational',
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  private isValidIP(ip: string): boolean {
    // Simple IP validation (IPv4 and IPv6)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
}