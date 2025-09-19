import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export interface DDoSProtectionConfig {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    suspiciousThreshold: number;
    attackThreshold: number;
    warningThreshold: number;
    slowdownThreshold: number;
    whitelist: string[];
    blacklist: string[];
    message: string;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}
export declare class DDoSProtectionMiddleware implements NestMiddleware {
    private readonly logger;
    private readonly generalLimiter;
    private readonly suspiciousLimiter;
    private readonly attackLimiter;
    private readonly suspiciousIPs;
    private readonly attackingIPs;
    private readonly warningIPs;
    private readonly config;
    constructor();
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private checkGeneralRateLimit;
    private checkSuspiciousActivity;
    private checkAttackPattern;
    private trackRequest;
    private isRequestSuspicious;
    private isWhitelisted;
    private isBlacklisted;
    private isLocalIP;
    private getClientIP;
    private addSecurityHeaders;
    private sendRateLimitResponse;
    private sendBlockedResponse;
    private alertAttack;
    getStats(): {
        suspiciousIPs: number;
        attackingIPs: number;
        warningIPs: number;
        config: DDoSProtectionConfig;
    };
    clearIP(ip: string): void;
    addToWhitelist(ip: string): void;
    addToBlacklist(ip: string): void;
}
