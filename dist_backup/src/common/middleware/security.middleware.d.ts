import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class SecurityMiddleware implements NestMiddleware {
    private readonly logger;
    private readonly helmetMiddleware;
    constructor();
    use(req: Request, res: Response, next: NextFunction): void;
    private addCustomSecurityHeaders;
    private logSecurityEvents;
    private detectSuspiciousActivity;
    private isSensitiveEndpoint;
    private getClientIP;
    private generateRequestId;
    private sanitizeHeaders;
}
