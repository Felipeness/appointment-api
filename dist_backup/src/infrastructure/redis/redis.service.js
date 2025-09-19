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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const redis_core_module_1 = require("./redis-core.module");
let RedisService = RedisService_1 = class RedisService {
    redis;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async onModuleInit() {
        try {
            await this.redis.connect();
            this.logger.log('✅ Redis connected successfully');
        }
        catch (error) {
            this.logger.error('❌ Failed to connect to Redis', error);
        }
    }
    async onModuleDestroy() {
        try {
            await this.redis.quit();
            this.logger.log('🔌 Redis connection closed');
        }
        catch (error) {
            this.logger.error('❌ Error closing Redis connection', error);
        }
    }
    async get(key) {
        return this.redis.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            return this.redis.setex(key, ttlSeconds, value);
        }
        return this.redis.set(key, value);
    }
    async setex(key, seconds, value) {
        return this.redis.setex(key, seconds, value);
    }
    async del(key) {
        return this.redis.del(key);
    }
    async exists(key) {
        return this.redis.exists(key);
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async keys(pattern) {
        return this.redis.keys(pattern);
    }
    async flushall() {
        return this.redis.flushall();
    }
    async getObject(key) {
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
    }
    async setObject(key, value, ttlSeconds) {
        return this.set(key, JSON.stringify(value), ttlSeconds);
    }
    async hget(key, field) {
        return this.redis.hget(key, field);
    }
    async hset(key, field, value) {
        return this.redis.hset(key, field, value);
    }
    async hdel(key, field) {
        return this.redis.hdel(key, field);
    }
    async hgetall(key) {
        return this.redis.hgetall(key);
    }
    async ping() {
        return this.redis.ping();
    }
    async isHealthy() {
        try {
            const result = await this.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_core_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.Redis])
], RedisService);
//# sourceMappingURL=redis.service.js.map