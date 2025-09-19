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
var RateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
exports.RATE_LIMIT_KEY = 'rate-limit';
const RateLimit = (options) => {
    return (target, propertyKey, descriptor) => {
        Reflect.defineMetadata(exports.RATE_LIMIT_KEY, options, descriptor.value);
        return descriptor;
    };
};
exports.RateLimit = RateLimit;
let RateLimitGuard = RateLimitGuard_1 = class RateLimitGuard {
    reflector;
    logger = new common_1.Logger(RateLimitGuard_1.name);
    rateLimiters = new Map();
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(context) {
        const rateLimitOptions = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler());
        if (!rateLimitOptions) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const key = this.generateKey(request, rateLimitOptions.keyPrefix);
        const rateLimiter = this.getRateLimiter(rateLimitOptions);
        try {
            await rateLimiter.consume(key);
            return true;
        }
        catch (rejRes) {
            if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
                const response = context.switchToHttp().getResponse();
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
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Too many requests, please try again later',
                    error: 'Too Many Requests',
                    retryAfter: Math.round(rejRes.msBeforeNext / 1000),
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            this.logger.error(`Rate limiter error for key: ${key}`, rejRes);
            return true;
        }
    }
    getRateLimiter(options) {
        const keyId = JSON.stringify(options);
        if (!this.rateLimiters.has(keyId)) {
            const rateLimiterOptions = {
                points: options.points,
                duration: options.duration,
                blockDuration: options.blockDuration || options.duration,
                keyPrefix: options.keyPrefix || 'rate-limit',
            };
            const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory(rateLimiterOptions);
            this.rateLimiters.set(keyId, rateLimiter);
        }
        return this.rateLimiters.get(keyId);
    }
    generateKey(request, keyPrefix) {
        const ip = this.getClientIP(request);
        const userId = request.user?.id;
        const endpoint = request.path;
        const parts = [keyPrefix || 'rate-limit', ip];
        if (userId) {
            parts.push('user', userId);
        }
        parts.push('endpoint', endpoint.replace(/[^a-zA-Z0-9]/g, '_'));
        return parts.join(':');
    }
    getClientIP(request) {
        return (request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            request.ip ||
            'unknown');
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = RateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map