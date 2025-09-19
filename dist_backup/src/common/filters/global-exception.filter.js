"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errorResponse = this.buildErrorResponse(exception, request);
        this.logError(exception, errorResponse, request);
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    buildErrorResponse(exception, request) {
        const timestamp = new Date().toISOString();
        const path = request.url;
        const method = request.method;
        const correlationId = request.headers['x-correlation-id'] ??
            this.generateCorrelationId();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            return {
                statusCode: status,
                timestamp,
                path,
                method,
                message: typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : this.safeStringify(exceptionResponse.message ??
                        exception.message),
                error: typeof exceptionResponse === 'string'
                    ? common_1.HttpStatus[status] || 'Unknown Error'
                    : this.safeStringify(exceptionResponse.error ??
                        common_1.HttpStatus[status] ??
                        'Unknown Error'),
                correlationId,
            };
        }
        if (exception instanceof library_1.PrismaClientKnownRequestError) {
            return this.handlePrismaKnownError(exception, timestamp, path, method, correlationId);
        }
        if (exception instanceof library_1.PrismaClientValidationError) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
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
        const isProduction = process.env.NODE_ENV === 'production';
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp,
            path,
            method,
            message: isProduction
                ? 'Internal server error'
                : (exception?.message ?? 'Unknown error'),
            error: 'Internal Server Error',
            details: isProduction
                ? undefined
                : {
                    stack: exception?.stack,
                    name: exception?.name,
                },
            correlationId,
        };
    }
    handlePrismaKnownError(exception, timestamp, path, method, correlationId) {
        switch (exception.code) {
            case 'P2002':
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
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
                    statusCode: common_1.HttpStatus.NOT_FOUND,
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
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
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
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
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
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    timestamp,
                    path,
                    method,
                    message: 'Database operation failed',
                    error: 'Database Error',
                    details: process.env.NODE_ENV === 'production'
                        ? undefined
                        : this.extractPrismaErrorDetails(exception),
                    correlationId,
                };
        }
    }
    extractPrismaErrorDetails(exception) {
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
    logError(exception, errorResponse, request) {
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
            body: request.body,
            query: request.query,
            params: request.params,
        };
        if (statusCode >= 500) {
            this.logger.error(`Server Error: ${Array.isArray(message) ? message.join(', ') : message}`, exception instanceof Error
                ? exception.stack
                : JSON.stringify(exception), JSON.stringify(logContext));
        }
        else if (statusCode >= 400) {
            this.logger.warn(`Client Error: ${Array.isArray(message) ? message.join(', ') : message}`, JSON.stringify(logContext));
        }
        else {
            this.logger.log(`Request completed: ${Array.isArray(message) ? message.join(', ') : message}`, JSON.stringify(logContext));
        }
    }
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    safeStringify(value) {
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
            }
            catch {
                return '[object Object]';
            }
        }
        return String(value);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map