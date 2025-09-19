"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
let SecurityController = class SecurityController {
    ddosProtection;
    constructor() {
    }
    async getSecurityStatus() {
        const stats = this.ddosProtection?.getStats() ?? {
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
    async addToWhitelist(body) {
        if (!this.isValidIP(body.ip)) {
            return {
                error: 'Invalid IP address format',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
            };
        }
        this.ddosProtection?.addToWhitelist(body.ip);
        return {
            message: 'IP address added to whitelist successfully',
            ip: body.ip,
            reason: body.reason ?? 'Manual addition',
            addedAt: new Date().toISOString(),
        };
    }
    async addToBlacklist(body) {
        if (!this.isValidIP(body.ip)) {
            return {
                error: 'Invalid IP address format',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
            };
        }
        this.ddosProtection?.addToBlacklist(body.ip);
        return {
            message: 'IP address added to blacklist successfully',
            ip: body.ip,
            reason: body.reason ?? 'Manual addition',
            addedAt: new Date().toISOString(),
        };
    }
    async clearIPRestrictions(body) {
        if (!this.isValidIP(body.ip)) {
            return {
                error: 'Invalid IP address format',
                statusCode: common_1.HttpStatus.BAD_REQUEST,
            };
        }
        this.ddosProtection?.clearIP(body.ip);
        return {
            message: 'IP restrictions cleared successfully',
            ip: body.ip,
            clearedAt: new Date().toISOString(),
        };
    }
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
    isValidIP(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
};
exports.SecurityController = SecurityController;
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.RateLimit)({ points: 5, duration: 60 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get security status and statistics',
        description: 'Returns current security protection status, rate limiting stats, and threat detection information.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityStatus", null);
__decorate([
    (0, common_1.Post)('whitelist'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.RateLimit)({ points: 2, duration: 300 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Add IP to whitelist',
        description: 'Add an IP address to the whitelist to bypass rate limiting and DDoS protection.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'IP added to whitelist successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                ip: { type: 'string' },
                addedAt: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "addToWhitelist", null);
__decorate([
    (0, common_1.Post)('blacklist'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.RateLimit)({ points: 5, duration: 300 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Add IP to blacklist',
        description: 'Add an IP address to the blacklist to block all requests from that IP.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'IP added to blacklist successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                ip: { type: 'string' },
                addedAt: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "addToBlacklist", null);
__decorate([
    (0, common_1.Post)('clear-ip'),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.RateLimit)({ points: 3, duration: 300 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Clear IP restrictions',
        description: 'Remove all restrictions (suspicious, attacking, warnings) for a specific IP address.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'IP restrictions cleared successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                ip: { type: 'string' },
                clearedAt: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "clearIPRestrictions", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, rate_limit_guard_1.RateLimit)({ points: 10, duration: 60 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Security health check',
        description: 'Quick health check for security components.',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getHealthStatus", null);
exports.SecurityController = SecurityController = __decorate([
    (0, swagger_1.ApiTags)('security'),
    (0, common_1.Controller)('security'),
    __metadata("design:paramtypes", [])
], SecurityController);
//# sourceMappingURL=security.controller.js.map