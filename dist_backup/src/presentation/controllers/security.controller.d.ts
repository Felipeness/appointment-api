import { HttpStatus } from '@nestjs/common';
export declare class SecurityController {
    private ddosProtection?;
    constructor();
    getSecurityStatus(): Promise<{
        status: string;
        timestamp: string;
        protections: {
            rateLimit: boolean;
            ddosProtection: boolean;
            securityHeaders: boolean;
            idempotency: boolean;
        };
        statistics: {
            suspiciousIPs: number;
            attackingIPs: number;
            warningIPs: number;
            totalBlocked: number;
        };
        configuration: {
            maxRequests: number;
            windowMs: number;
            suspiciousThreshold: number;
            attackThreshold: number;
        };
    }>;
    addToWhitelist(body: {
        ip: string;
        reason?: string;
    }): Promise<{
        error: string;
        statusCode: HttpStatus;
        message?: undefined;
        ip?: undefined;
        reason?: undefined;
        addedAt?: undefined;
    } | {
        message: string;
        ip: string;
        reason: string;
        addedAt: string;
        error?: undefined;
        statusCode?: undefined;
    }>;
    addToBlacklist(body: {
        ip: string;
        reason?: string;
    }): Promise<{
        error: string;
        statusCode: HttpStatus;
        message?: undefined;
        ip?: undefined;
        reason?: undefined;
        addedAt?: undefined;
    } | {
        message: string;
        ip: string;
        reason: string;
        addedAt: string;
        error?: undefined;
        statusCode?: undefined;
    }>;
    clearIPRestrictions(body: {
        ip: string;
    }): Promise<{
        error: string;
        statusCode: HttpStatus;
        message?: undefined;
        ip?: undefined;
        clearedAt?: undefined;
    } | {
        message: string;
        ip: string;
        clearedAt: string;
        error?: undefined;
        statusCode?: undefined;
    }>;
    getHealthStatus(): Promise<{
        status: string;
        components: {
            rateLimiting: string;
            ddosProtection: string;
            securityHeaders: string;
            idempotency: string;
        };
        uptime: number;
        timestamp: string;
    }>;
    private isValidIP;
}
