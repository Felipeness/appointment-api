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
var DDoSProtectionMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DDoSProtectionMiddleware = void 0;
const common_1 = require("@nestjs/common");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
let DDoSProtectionMiddleware = DDoSProtectionMiddleware_1 = class DDoSProtectionMiddleware {
    logger = new common_1.Logger(DDoSProtectionMiddleware_1.name);
    generalLimiter;
    suspiciousLimiter;
    attackLimiter;
    suspiciousIPs = new Set();
    attackingIPs = new Set();
    warningIPs = new Map();
    config;
    constructor() {
        this.config = {
            enabled: process.env.NODE_ENV === 'production',
            windowMs: 60000,
            maxRequests: 100,
            suspiciousThreshold: 200,
            attackThreshold: 500,
            warningThreshold: 50,
            slowdownThreshold: 150,
            whitelist: [
                '127.0.0.1',
                '::1',
                'localhost',
            ],
            blacklist: [],
            message: 'Too many requests from this IP. Please try again later.',
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        };
        this.generalLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
            keyPrefix: 'ddos-general',
            points: this.config.maxRequests,
            duration: Math.floor(this.config.windowMs / 1000),
            blockDuration: Math.floor(this.config.windowMs / 1000) * 2,
        });
        this.suspiciousLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
            keyPrefix: 'ddos-suspicious',
            points: this.config.suspiciousThreshold,
            duration: 60,
            blockDuration: 300,
        });
        this.attackLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
            keyPrefix: 'ddos-attack',
            points: this.config.attackThreshold,
            duration: 60,
            blockDuration: 3600,
        });
        this.logger.log('DDoS Protection initialized', {
            enabled: this.config.enabled,
            maxRequests: this.config.maxRequests,
            windowMs: this.config.windowMs,
            suspiciousThreshold: this.config.suspiciousThreshold,
            attackThreshold: this.config.attackThreshold,
        });
    }
    async use(req, res, next) {
        if (!this.config.enabled) {
            return next();
        }
        const clientIP = this.getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        const endpoint = req.path;
        try {
            if (this.isWhitelisted(clientIP)) {
                return next();
            }
            if (this.isBlacklisted(clientIP)) {
                this.logger.warn(`Blocked blacklisted IP: ${clientIP}`, {
                    ip: clientIP,
                    userAgent,
                    endpoint,
                });
                return this.sendBlockedResponse(res, 'IP address is blocked');
            }
            if (this.attackingIPs.has(clientIP)) {
                this.logger.warn(`Blocked attacking IP: ${clientIP}`, {
                    ip: clientIP,
                    userAgent,
                    endpoint,
                });
                return this.sendBlockedResponse(res, 'IP address is temporarily blocked due to suspicious activity');
            }
            await this.checkGeneralRateLimit(clientIP, req, res);
            await this.checkSuspiciousActivity(clientIP, req, res);
            await this.checkAttackPattern(clientIP, req, res);
            this.addSecurityHeaders(res);
            this.trackRequest(clientIP, req);
            next();
        }
        catch (error) {
            if (error instanceof rate_limiter_flexible_1.RateLimiterRes) {
                return;
            }
            this.logger.error(`DDoS protection error for IP: ${clientIP}`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            next();
        }
    }
    async checkGeneralRateLimit(ip, req, res) {
        try {
            const limiterRes = await this.generalLimiter.consume(ip);
            res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', limiterRes.remainingPoints);
            res.setHeader('X-RateLimit-Reset', Math.round(limiterRes.msBeforeNext / 1000));
            if (limiterRes.remainingPoints < this.config.warningThreshold) {
                this.warningIPs.set(ip, (this.warningIPs.get(ip) || 0) + 1);
                this.logger.warn(`High request rate from IP: ${ip}`, {
                    ip,
                    remaining: limiterRes.remainingPoints,
                    endpoint: req.path,
                    userAgent: req.headers['user-agent'],
                });
            }
        }
        catch (rejRes) {
            if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
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
    async checkSuspiciousActivity(ip, req, res) {
        try {
            await this.suspiciousLimiter.consume(ip);
        }
        catch (rejRes) {
            if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
                this.suspiciousIPs.add(ip);
                this.logger.warn(`Suspicious activity detected from IP: ${ip}`, {
                    ip,
                    endpoint: req.path,
                    userAgent: req.headers['user-agent'],
                    requestCount: this.config.suspiciousThreshold,
                });
                res.setHeader('X-Suspicious-Activity', 'true');
                this.sendRateLimitResponse(res, rejRes, 'Suspicious activity detected');
                throw rejRes;
            }
            throw rejRes;
        }
    }
    async checkAttackPattern(ip, req, res) {
        try {
            await this.attackLimiter.consume(ip);
        }
        catch (rejRes) {
            if (rejRes instanceof rate_limiter_flexible_1.RateLimiterRes) {
                this.attackingIPs.add(ip);
                this.logger.error(`DDoS attack pattern detected from IP: ${ip}`, {
                    ip,
                    endpoint: req.path,
                    userAgent: req.headers['user-agent'],
                    requestCount: this.config.attackThreshold,
                    blockDuration: rejRes.msBeforeNext,
                });
                this.alertAttack(ip, req);
                res.setHeader('X-Attack-Detected', 'true');
                this.sendRateLimitResponse(res, rejRes, 'DDoS attack detected - IP temporarily blocked');
                throw rejRes;
            }
            throw rejRes;
        }
    }
    trackRequest(ip, req) {
        const timestamp = Date.now();
        const requestData = {
            ip,
            timestamp,
            path: req.path,
            method: req.method,
            userAgent: req.headers['user-agent'],
            contentLength: req.headers['content-length'],
        };
        if (this.isRequestSuspicious(req)) {
            this.logger.warn(`Suspicious request pattern detected`, requestData);
        }
    }
    isRequestSuspicious(req) {
        const userAgent = req.headers['user-agent'] || '';
        const path = req.path;
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
        return (suspiciousPatterns.some((pattern) => pattern.test(userAgent)) ||
            suspiciousPaths.some((pattern) => pattern.test(path)) ||
            (contentLength !== undefined && parseInt(contentLength) > 10000000));
    }
    isWhitelisted(ip) {
        return this.config.whitelist.includes(ip) || this.isLocalIP(ip);
    }
    isBlacklisted(ip) {
        return this.config.blacklist.includes(ip);
    }
    isLocalIP(ip) {
        return (ip === '127.0.0.1' ||
            ip === '::1' ||
            ip.startsWith('192.168.') ||
            ip.startsWith('10.') ||
            ip.startsWith('172.') ||
            false);
    }
    getClientIP(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.ip ||
            'unknown');
    }
    addSecurityHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    sendRateLimitResponse(res, rejRes, customMessage) {
        res.status(common_1.HttpStatus.TOO_MANY_REQUESTS).json({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            message: customMessage || this.config.message,
            error: 'Too Many Requests',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000),
            remainingHits: rejRes.remainingPoints || 0,
        });
    }
    sendBlockedResponse(res, message) {
        res.status(common_1.HttpStatus.FORBIDDEN).json({
            statusCode: common_1.HttpStatus.FORBIDDEN,
            message,
            error: 'Forbidden',
        });
    }
    alertAttack(ip, req) {
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
    getStats() {
        return {
            suspiciousIPs: this.suspiciousIPs.size,
            attackingIPs: this.attackingIPs.size,
            warningIPs: this.warningIPs.size,
            config: this.config,
        };
    }
    clearIP(ip) {
        this.suspiciousIPs.delete(ip);
        this.attackingIPs.delete(ip);
        this.warningIPs.delete(ip);
        this.logger.log(`Cleared restrictions for IP: ${ip}`);
    }
    addToWhitelist(ip) {
        this.config.whitelist.push(ip);
        this.clearIP(ip);
        this.logger.log(`Added IP to whitelist: ${ip}`);
    }
    addToBlacklist(ip) {
        this.config.blacklist.push(ip);
        this.logger.log(`Added IP to blacklist: ${ip}`);
    }
};
exports.DDoSProtectionMiddleware = DDoSProtectionMiddleware;
exports.DDoSProtectionMiddleware = DDoSProtectionMiddleware = DDoSProtectionMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DDoSProtectionMiddleware);
//# sourceMappingURL=ddos-protection.middleware.js.map