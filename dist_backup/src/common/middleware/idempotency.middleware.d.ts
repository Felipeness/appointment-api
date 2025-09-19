import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../infrastructure/config/env.validation';
export interface RequestWithIdempotency extends Request {
    idempotencyKey?: string;
}
export declare class IdempotencyMiddleware implements NestMiddleware {
    private readonly configService;
    private readonly redis;
    private readonly IDEMPOTENCY_TTL;
    constructor(configService: ConfigService<EnvConfig>);
    use(req: RequestWithIdempotency, res: Response, next: NextFunction): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
