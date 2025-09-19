"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IdempotencyInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const idempotency_decorator_1 = require("../decorators/idempotency.decorator");
let IdempotencyInterceptor = IdempotencyInterceptor_1 = class IdempotencyInterceptor {
    reflector;
    idempotencyService;
    logger = new common_1.Logger(IdempotencyInterceptor_1.name);
    constructor(reflector, idempotencyService) {
        this.reflector = reflector;
        this.idempotencyService = idempotencyService;
    }
    async intercept(context, next) {
        const options = this.reflector.get(idempotency_decorator_1.IDEMPOTENCY_KEY, context.getHandler());
        if (!options) {
            return next.handle();
        }
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        const idempotencyKey = this.extractIdempotencyKey(request);
        if (!idempotencyKey) {
            return next.handle();
        }
        if (!this.validateIdempotencyKey(idempotencyKey)) {
            throw new common_1.ConflictException('Invalid idempotency key format');
        }
        const userId = this.extractUserId(request);
        const endpoint = this.buildEndpoint(request);
        const parameters = this.extractParameters(request);
        const existingRecord = await this.idempotencyService.get(idempotencyKey, userId, endpoint);
        if (existingRecord) {
            if (options.validateParameters) {
                const parametersMatch = await this.idempotencyService.validateParameters(idempotencyKey, parameters, userId, endpoint);
                if (!parametersMatch) {
                    throw new common_1.ConflictException('Idempotency key reused with different parameters');
                }
            }
            this.logger.log(`Returning cached response for idempotency key`, {
                key: idempotencyKey,
                endpoint,
                userId,
                statusCode: existingRecord.response.statusCode,
            });
            response.status(existingRecord.response.statusCode);
            if (existingRecord.response.headers) {
                Object.entries(existingRecord.response.headers).forEach(([key, value]) => {
                    response.header(key, value);
                });
            }
            response.header('X-Idempotency-Key', idempotencyKey);
            response.header('X-Idempotency-Cached', 'true');
            return new rxjs_1.Observable((subscriber) => {
                subscriber.next(existingRecord.response.body);
                subscriber.complete();
            });
        }
        return next.handle().pipe((0, operators_1.tap)((data) => {
            void (async () => {
                try {
                    const record = {
                        key: idempotencyKey,
                        userId,
                        endpoint,
                        method: request.method,
                        parameters,
                        response: {
                            statusCode: response.statusCode,
                            body: data,
                            headers: {
                                'content-type': response.getHeader('content-type') ??
                                    'application/json',
                            },
                        },
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + (options.ttl ?? 3600) * 1000),
                    };
                    await this.idempotencyService.store(record);
                    response.header('X-Idempotency-Key', idempotencyKey);
                    response.header('X-Idempotency-Cached', 'false');
                    this.logger.log(`Stored new idempotency record`, {
                        key: idempotencyKey,
                        endpoint,
                        userId,
                        statusCode: response.statusCode,
                    });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    this.logger.error(`Failed to store idempotency record`, {
                        key: idempotencyKey,
                        error: errorMessage,
                    });
                }
            })();
        }));
    }
    extractIdempotencyKey(request) {
        let key = request.headers['idempotency-key'];
        if (!key) {
            key = request.query['idempotency-key'];
        }
        return key?.trim();
    }
    extractUserId(request) {
        return (request.headers['x-user-id'] ??
            request.user?.id ??
            request.user?.userId);
    }
    buildEndpoint(request) {
        const routePath = request.route?.path ?? request.path;
        return `${request.method}:${routePath}`;
    }
    extractParameters(request) {
        return {
            body: request.body ?? {},
            query: request.query ?? {},
            params: request.params ?? {},
        };
    }
    validateIdempotencyKey(key) {
        const pattern = /^[a-zA-Z0-9_-]+$/;
        return pattern.test(key) && key.length <= 255 && key.length >= 1;
    }
};
exports.IdempotencyInterceptor = IdempotencyInterceptor;
exports.IdempotencyInterceptor = IdempotencyInterceptor = IdempotencyInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IdempotencyService')),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], IdempotencyInterceptor);
//# sourceMappingURL=idempotency.interceptor.js.map