"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const express = __importStar(require("express"));
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const correlation_id_interceptor_1 = require("./common/interceptors/correlation-id.interceptor");
const ddos_protection_middleware_1 = require("./common/middleware/ddos-protection.middleware");
const security_middleware_1 = require("./common/middleware/security.middleware");
const correlation_id_middleware_1 = require("./common/middleware/correlation-id.middleware");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get((config_1.ConfigService));
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    const nodeEnv = configService.get('NODE_ENV', { infer: true });
    const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
    const port = configService.get('PORT', { infer: true });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: nodeEnv === 'production' ? [] : null,
            },
        },
        hsts: nodeEnv === 'production'
            ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            }
            : false,
        referrerPolicy: { policy: 'same-origin' },
    }));
    const corsOrigins = corsOrigin?.split(',').map((origin) => origin.trim()) ?? [
        'http://localhost:3000',
    ];
    app.enableCors({
        origin: nodeEnv === 'production' ? corsOrigins : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-HTTP-Method-Override',
            'Accept',
            'Observe',
            'x-correlation-id',
            'Idempotency-Key',
        ],
    });
    app.use(new correlation_id_middleware_1.CorrelationIdMiddleware(configService).use.bind(new correlation_id_middleware_1.CorrelationIdMiddleware(configService)));
    app.use(new security_middleware_1.SecurityMiddleware().use.bind(new security_middleware_1.SecurityMiddleware()));
    app.use(new ddos_protection_middleware_1.DDoSProtectionMiddleware().use.bind(new ddos_protection_middleware_1.DDoSProtectionMiddleware()));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new correlation_id_interceptor_1.CorrelationIdInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const messages = errors.map((error) => {
                const constraints = Object.values(error.constraints ?? {});
                return `${error.property}: ${constraints.join(', ')}`;
            });
            return new Error(`Validation failed: ${messages.join('; ')}`);
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Appointment API')
        .setDescription('Online Consultation Scheduling API with asynchronous processing')
        .setVersion('1.0')
        .addTag('appointments')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(port ?? 3000);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger documentation: http://localhost:${port}/api`);
    logger.log(`Environment: ${nodeEnv}`);
    logger.log(`CORS Origins: ${corsOrigins.join(', ')}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map