import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

import type {
  IdempotencyService,
  IdempotencyRecord,
} from '../interfaces/idempotency.interface';
import {
  IDEMPOTENCY_KEY,
  IdempotencyOptions,
} from '../decorators/idempotency.decorator';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    userId?: string;
  };
}

interface RequestWithRoute extends Request {
  route: {
    path?: string;
  };
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject('IdempotencyService')
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const options = this.reflector.get<IdempotencyOptions>(
      IDEMPOTENCY_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();

    const idempotencyKey = this.extractIdempotencyKey(request);

    if (!idempotencyKey) {
      // No idempotency key provided, proceed normally
      return next.handle();
    }

    if (!this.validateIdempotencyKey(idempotencyKey)) {
      throw new ConflictException('Invalid idempotency key format');
    }

    const userId = this.extractUserId(request);
    const endpoint = this.buildEndpoint(request);
    const parameters = this.extractParameters(request);

    // Check if we already have this idempotency key
    const existingRecord = await this.idempotencyService.get(
      idempotencyKey,
      userId,
      endpoint,
    );

    if (existingRecord) {
      // Validate parameters match
      if (options.validateParameters) {
        const parametersMatch =
          await this.idempotencyService.validateParameters(
            idempotencyKey,
            parameters,
            userId,
            endpoint,
          );

        if (!parametersMatch) {
          throw new ConflictException(
            'Idempotency key reused with different parameters',
          );
        }
      }

      this.logger.log(`Returning cached response for idempotency key`, {
        key: idempotencyKey,
        endpoint,
        userId,
        statusCode: existingRecord.response.statusCode,
      });

      // Return cached response
      response.status(existingRecord.response.statusCode);

      if (existingRecord.response.headers) {
        Object.entries(existingRecord.response.headers).forEach(
          ([key, value]) => {
            response.header(key, value);
          },
        );
      }

      // Add idempotency headers
      response.header('X-Idempotency-Key', idempotencyKey);
      response.header('X-Idempotency-Cached', 'true');

      return new Observable((subscriber) => {
        subscriber.next(existingRecord.response.body);
        subscriber.complete();
      });
    }

    // Process new request and cache result
    return next.handle().pipe(
      tap((data) => {
        // Using void to handle the Promise properly
        void (async () => {
          try {
            const record: IdempotencyRecord = {
              key: idempotencyKey,
              userId,
              endpoint,
              method: request.method,
              parameters,
              response: {
                statusCode: response.statusCode,
                body: data as Record<string, unknown>,
                headers: {
                  'content-type': (() => {
                    const contentType = response.getHeader('content-type');
                    return typeof contentType === 'string'
                      ? contentType
                      : 'application/json';
                  })(),
                },
              },
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + (options.ttl ?? 3600) * 1000),
            };

            await this.idempotencyService.store(record);

            // Add idempotency headers to response
            response.header('X-Idempotency-Key', idempotencyKey);
            response.header('X-Idempotency-Cached', 'false');

            this.logger.log(`Stored new idempotency record`, {
              key: idempotencyKey,
              endpoint,
              userId,
              statusCode: response.statusCode,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to store idempotency record`, {
              key: idempotencyKey,
              error: errorMessage,
            });
            // Don't fail the request if we can't store idempotency record
          }
        })();
      }),
    );
  }

  private extractIdempotencyKey(request: Request): string | undefined {
    // Check header (primary)
    let key = request.headers['idempotency-key'] as string;

    // Fallback to query parameter
    if (!key) {
      key = request.query['idempotency-key'] as string;
    }

    return key?.trim();
  }

  private extractUserId(request: RequestWithUser): string | undefined {
    // Multiple ways to extract user ID
    const userIdHeader = request.headers['x-user-id'];
    return (
      (typeof userIdHeader === 'string' ? userIdHeader : undefined) ??
      request.user?.id ??
      request.user?.userId
    );
  }

  private buildEndpoint(request: Request): string {
    const routePath = (request as RequestWithRoute).route?.path ?? request.path;
    return `${request.method}:${routePath}`;
  }

  private extractParameters(request: Request): Record<string, unknown> {
    return {
      body: (request.body as Record<string, unknown>) ?? {},
      query: request.query ?? {},
      params: request.params ?? {},
    };
  }

  private validateIdempotencyKey(key: string): boolean {
    // UUID format or alphanumeric with dashes and underscores
    const pattern = /^[a-zA-Z0-9_-]+$/;
    return pattern.test(key) && key.length <= 255 && key.length >= 1;
  }
}
