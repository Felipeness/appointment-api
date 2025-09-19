import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
  details?: Record<string, unknown>;
  correlationId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log error with different levels based on status code
    this.logError(exception, errorResponse, request);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const correlationId =
      (request.headers['x-correlation-id'] as string) ??
      this.generateCorrelationId();

    // Handle HTTP Exceptions (NestJS built-in)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return {
        statusCode: status,
        timestamp,
        path,
        method,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : this.safeStringify(
                (exceptionResponse as Record<string, unknown>).message ??
                  exception.message,
              ),
        error:
          typeof exceptionResponse === 'string'
            ? (HttpStatus[status] ?? 'Unknown Error')
            : this.safeStringify(
                (exceptionResponse as Record<string, unknown>).error ??
                  HttpStatus[status] ??
                  'Unknown Error',
              ),
        correlationId,
      };
    }

    // Handle Prisma Errors
    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(
        exception,
        timestamp,
        path,
        method,
        correlationId,
      );
    }

    if (exception instanceof PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        message: 'Invalid data provided',
        error: 'Validation Error',
        details: {
          message: 'Data validation failed. Please check your input.',
        },
        correlationId,
      };
    }

    // Handle generic errors
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      message: isProduction
        ? 'Internal server error'
        : ((exception as Error)?.message ?? 'Unknown error'),
      error: 'Internal Server Error',
      details: isProduction
        ? undefined
        : {
            stack: (exception as Error)?.stack,
            name: (exception as Error)?.name,
          },
      correlationId,
    };
  }

  private handlePrismaKnownError(
    exception: PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
    method: string,
    correlationId: string,
  ): ErrorResponse {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          timestamp,
          path,
          method,
          message: 'A record with this information already exists',
          error: 'Duplicate Entry',
          details: this.extractPrismaErrorDetails(exception),
          correlationId,
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          timestamp,
          path,
          method,
          message: 'Record not found',
          error: 'Not Found',
          details: this.extractPrismaErrorDetails(exception),
          correlationId,
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
          method,
          message: 'Foreign key constraint failed',
          error: 'Constraint Violation',
          details: this.extractPrismaErrorDetails(exception),
          correlationId,
        };

      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
          method,
          message: 'Invalid relationship data provided',
          error: 'Invalid Relation',
          details: this.extractPrismaErrorDetails(exception),
          correlationId,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp,
          path,
          method,
          message: 'Database operation failed',
          error: 'Database Error',
          details:
            process.env.NODE_ENV === 'production'
              ? undefined
              : this.extractPrismaErrorDetails(exception),
          correlationId,
        };
    }
  }

  private extractPrismaErrorDetails(
    exception: PrismaClientKnownRequestError,
  ): Record<string, unknown> {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return {
        code: exception.code,
      };
    }

    return {
      code: exception.code,
      meta: exception.meta,
      clientVersion: exception.clientVersion,
    };
  }

  private logError(
    exception: unknown,
    errorResponse: ErrorResponse,
    request: Request,
  ): void {
    const { statusCode, correlationId, message } = errorResponse;
    const userAgent = request.headers['user-agent'] ?? 'Unknown';
    const ip = request.ip ?? 'Unknown';

    const logContext = {
      correlationId,
      method: request.method,
      url: request.url,
      statusCode,
      userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent,
      ip: Array.isArray(ip) ? ip.join(', ') : ip,
      body: request.body as unknown,
      query: request.query,
      params: request.params,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `Server Error: ${Array.isArray(message) ? message.join(', ') : message}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
        JSON.stringify(logContext),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `Client Error: ${Array.isArray(message) ? message.join(', ') : message}`,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.log(
        `Request completed: ${Array.isArray(message) ? message.join(', ') : message}`,
        JSON.stringify(logContext),
      );
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private safeStringify(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value === null || value === undefined) {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object Object]';
      }
    }
    return '[Unknown Value]';
  }
}
