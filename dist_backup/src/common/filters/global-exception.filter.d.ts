import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
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
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private buildErrorResponse;
    private handlePrismaKnownError;
    private extractPrismaErrorDetails;
    private logError;
    private generateCorrelationId;
    private safeStringify;
}
