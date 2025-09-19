"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
let SecurityModule = class SecurityModule {
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRootAsync({
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            name: 'short',
                            ttl: Number(configService.get('RATE_LIMIT_TTL', 60)) * 1000,
                            limit: Number(configService.get('RATE_LIMIT_MAX', 100)),
                        },
                        {
                            name: 'medium',
                            ttl: 300 * 1000,
                            limit: 1000,
                        },
                        {
                            name: 'long',
                            ttl: 3600 * 1000,
                            limit: 5000,
                        },
                    ],
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_2.ThrottlerGuard,
            },
        ],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map