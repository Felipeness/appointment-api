import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../infrastructure/config/env.validation';
export interface RequestWithCorrelationId extends Request {
    correlationId?: string;
}
export declare class CorrelationIdMiddleware implements NestMiddleware {
    private readonly configService;
    constructor(configService: ConfigService<EnvConfig>);
    use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void;
}
