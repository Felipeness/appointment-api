import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import type { IdempotencyService } from '../interfaces/idempotency.interface';
export declare class IdempotencyInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly idempotencyService;
    private readonly logger;
    constructor(reflector: Reflector, idempotencyService: IdempotencyService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
    private extractIdempotencyKey;
    private extractUserId;
    private buildEndpoint;
    private extractParameters;
    private validateIdempotencyKey;
}
