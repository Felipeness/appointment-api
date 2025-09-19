import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export interface RateLimitOptions {
    points: number;
    duration: number;
    blockDuration?: number;
    keyPrefix?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare const RATE_LIMIT_KEY = "rate-limit";
export declare const RateLimit: (options: RateLimitOptions) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private readonly logger;
    private readonly rateLimiters;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getRateLimiter;
    private generateKey;
    private getClientIP;
}
