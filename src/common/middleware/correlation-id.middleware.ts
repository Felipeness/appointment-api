import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { EnvConfig } from '../../infrastructure/config/env.validation';

export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService<EnvConfig>) {}

  use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void {
    const correlationIdHeader =
      this.configService.get('CORRELATION_ID_HEADER', { infer: true }) ||
      'x-correlation-id';

    // Extract correlation ID from header or generate new one
    const correlationId =
      (req.headers[correlationIdHeader] as string) || uuidv4();

    // Set correlation ID on request object
    req.correlationId = correlationId;

    // Set correlation ID in response headers
    res.setHeader(correlationIdHeader, correlationId);

    // Continue to next middleware
    next();
  }
}
