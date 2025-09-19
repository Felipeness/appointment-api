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
var RedisIdempotencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisIdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let RedisIdempotencyService = RedisIdempotencyService_1 = class RedisIdempotencyService {
    logger = new common_1.Logger(RedisIdempotencyService_1.name);
    cache = new Map();
    constructor() { }
    async store(record) {
        const cacheKey = this.buildCacheKey(record.key, record.userId, record.endpoint);
        this.cache.set(cacheKey, record);
        this.logger.debug(`Stored idempotency record`, {
            key: record.key,
            endpoint: record.endpoint,
            cacheKey,
        });
    }
    async get(key, userId, endpoint) {
        const cacheKey = this.buildCacheKey(key, userId, endpoint);
        const record = this.cache.get(cacheKey);
        if (record) {
            if (record.expiresAt.getTime() < Date.now()) {
                this.cache.delete(cacheKey);
                return null;
            }
            return record;
        }
        return null;
    }
    async exists(key, userId, endpoint) {
        const record = await this.get(key, userId, endpoint);
        return record !== null;
    }
    async cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [cacheKey, record] of this.cache.entries()) {
            if (record.expiresAt.getTime() < now) {
                expiredKeys.push(cacheKey);
            }
        }
        expiredKeys.forEach((key) => this.cache.delete(key));
        if (expiredKeys.length > 0) {
            this.logger.log(`Cleaned up ${expiredKeys.length} expired idempotency records`);
        }
        await Promise.resolve();
    }
    async validateParameters(key, parameters, userId, endpoint) {
        const record = await this.get(key, userId, endpoint);
        if (!record) {
            return true;
        }
        const currentHash = this.hashParameters(parameters);
        const storedHash = this.hashParameters(record.parameters);
        return currentHash === storedHash;
    }
    buildCacheKey(key, userId, endpoint) {
        const parts = ['idempotency', key];
        if (userId) {
            parts.push('user', userId);
        }
        if (endpoint) {
            parts.push('endpoint', endpoint.replace(/[^a-zA-Z0-9]/g, '_'));
        }
        return parts.join(':');
    }
    hashParameters(parameters) {
        const sortedParams = JSON.stringify(parameters, Object.keys(parameters).sort());
        return (0, crypto_1.createHash)('sha256').update(sortedParams).digest('hex');
    }
};
exports.RedisIdempotencyService = RedisIdempotencyService;
exports.RedisIdempotencyService = RedisIdempotencyService = RedisIdempotencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisIdempotencyService);
//# sourceMappingURL=idempotency.service.js.map