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
const rate_limit_guard_1 = require("../guards/rate-limit.guard");
const ddos_protection_middleware_1 = require("../middleware/ddos-protection.middleware");
const security_middleware_1 = require("../middleware/security.middleware");
const security_controller_1 = require("../../presentation/controllers/security.controller");
const sqs_idempotency_service_1 = require("../services/sqs-idempotency.service");
let SecurityModule = class SecurityModule {
};
exports.SecurityModule = SecurityModule;
exports.SecurityModule = SecurityModule = __decorate([
    (0, common_1.Module)({
        providers: [
            rate_limit_guard_1.RateLimitGuard,
            ddos_protection_middleware_1.DDoSProtectionMiddleware,
            security_middleware_1.SecurityMiddleware,
            sqs_idempotency_service_1.SQSIdempotencyService,
        ],
        controllers: [security_controller_1.SecurityController],
        exports: [
            rate_limit_guard_1.RateLimitGuard,
            ddos_protection_middleware_1.DDoSProtectionMiddleware,
            security_middleware_1.SecurityMiddleware,
            sqs_idempotency_service_1.SQSIdempotencyService,
        ],
    })
], SecurityModule);
//# sourceMappingURL=security.module.js.map