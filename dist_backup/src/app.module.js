"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const configuration_module_1 = require("./infrastructure/config/configuration.module");
const appointment_module_1 = require("./appointment.module");
const idempotency_module_1 = require("./common/modules/idempotency.module");
const security_module_1 = require("./common/modules/security.module");
const transactional_outbox_service_1 = require("./infrastructure/database/outbox/transactional-outbox.service");
const prisma_service_1 = require("./infrastructure/database/prisma.service");
const aws_sqs_producer_1 = require("./infrastructure/messaging/aws-sqs.producer");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            configuration_module_1.ConfigurationModule,
            schedule_1.ScheduleModule.forRoot(),
            appointment_module_1.AppointmentModule,
            idempotency_module_1.IdempotencyModule,
            security_module_1.SecurityModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            transactional_outbox_service_1.TransactionalOutboxService,
            prisma_service_1.PrismaService,
            aws_sqs_producer_1.AwsSqsProducer,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map