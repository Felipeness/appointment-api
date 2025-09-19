"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCoreModule = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let RedisCoreModule = class RedisCoreModule {
};
exports.RedisCoreModule = RedisCoreModule;
exports.RedisCoreModule = RedisCoreModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.REDIS_CLIENT,
                useFactory: (configService) => {
                    const host = configService.get('REDIS_HOST', 'localhost');
                    const port = configService.get('REDIS_PORT', 6379);
                    const password = configService.get('REDIS_PASSWORD');
                    return new ioredis_1.default({
                        host,
                        port,
                        password,
                        enableReadyCheck: false,
                        maxRetriesPerRequest: null,
                        lazyConnect: true,
                        showFriendlyErrorStack: true,
                    });
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [exports.REDIS_CLIENT],
    })
], RedisCoreModule);
//# sourceMappingURL=redis-core.module.js.map