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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = __importDefault(require("redis"));
let IdempotencyMiddleware = class IdempotencyMiddleware {
    configService;
    redis;
    IDEMPOTENCY_TTL = 86400;
    constructor(configService) {
        this.configService = configService;
        const redisHost = this.configService.get('REDIS_HOST', { infer: true });
        const redisPort = this.configService.get('REDIS_PORT', { infer: true });
        const redisPassword = this.configService.get('REDIS_PASSWORD', {
            infer: true,
        });
        this.redis = redis_1.default.createClient({
            socket: {
                host: redisHost,
                port: redisPort,
            },
            password: redisPassword,
        });
        this.redis.connect().catch(console.error);
    }
    async use(req, res, next) {
        if (req.method === 'GET' ||
            req.method === 'HEAD' ||
            req.method === 'OPTIONS') {
            return next();
        }
        const idempotencyKey = req.headers['idempotency-key'];
        if (!idempotencyKey) {
            return next();
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(idempotencyKey)) {
            res.status(common_1.HttpStatus.BAD_REQUEST).json({
                error: 'Invalid idempotency key format. Must be a valid UUID v4.',
                code: 'INVALID_IDEMPOTENCY_KEY',
            });
            return;
        }
        req.idempotencyKey = idempotencyKey;
        try {
            const cacheKey = `idempotency:${idempotencyKey}:${req.method}:${req.path}`;
            const cachedResponseStr = await this.redis.get(cacheKey);
            if (cachedResponseStr) {
                const cachedResponse = JSON.parse(cachedResponseStr);
                Object.entries(cachedResponse.headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                res.setHeader('X-Idempotency-Replay', 'true');
                res.status(cachedResponse.statusCode).json(cachedResponse.body);
                return;
            }
            const originalSend = res.send;
            const originalJson = res.json;
            let responseBody;
            let responseHeaders = {};
            res.json = function (body) {
                responseBody = body;
                responseHeaders = this.getHeaders();
                return originalJson.call(this, body);
            };
            res.send = function (body) {
                responseBody = body;
                responseHeaders = this.getHeaders();
                return originalSend.call(this, body);
            };
            next();
            res.on('finish', () => {
                void (async () => {
                    if (res.statusCode >= 200 && res.statusCode < 300 && responseBody) {
                        const cachedResponse = {
                            statusCode: res.statusCode,
                            body: responseBody,
                            headers: responseHeaders,
                            timestamp: Date.now(),
                        };
                        try {
                            await this.redis.setEx(cacheKey, this.IDEMPOTENCY_TTL, JSON.stringify(cachedResponse));
                        }
                        catch (error) {
                            console.error('Failed to cache idempotent response:', error);
                        }
                    }
                })();
            });
        }
        catch (error) {
            console.error('Idempotency middleware error:', error);
            next();
        }
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
};
exports.IdempotencyMiddleware = IdempotencyMiddleware;
exports.IdempotencyMiddleware = IdempotencyMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IdempotencyMiddleware);
//# sourceMappingURL=idempotency.middleware.js.map