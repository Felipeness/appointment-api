"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./infrastructure/database/prisma.service");
const resilient_prisma_service_1 = require("./infrastructure/database/resilient-prisma.service");
const enterprise_sqs_module_1 = require("./infrastructure/messaging/enterprise-sqs.module");
const aws_sqs_producer_1 = require("./infrastructure/messaging/aws-sqs.producer");
const saga_orchestrator_1 = require("./common/saga/saga-orchestrator");
const dlq_handler_1 = require("./common/resilience/dlq-handler");
const outbox_service_1 = require("./infrastructure/database/outbox/outbox.service");
const outbox_repository_1 = require("./infrastructure/database/outbox/outbox.repository");
const prisma_psychologist_repository_1 = require("./infrastructure/database/repositories/prisma-psychologist.repository");
const prisma_patient_repository_1 = require("./infrastructure/database/repositories/prisma-patient.repository");
const prisma_appointment_repository_1 = require("./infrastructure/database/repositories/prisma-appointment.repository");
const enterprise_schedule_appointment_use_case_1 = require("./application/use-cases/enterprise-schedule-appointment.use-case");
const list_appointments_use_case_1 = require("./application/use-cases/list-appointments.use-case");
const process_appointment_use_case_1 = require("./application/use-cases/process-appointment.use-case");
const resilient_process_appointment_use_case_1 = require("./application/use-cases/resilient-process-appointment.use-case");
const sqs_idempotency_service_1 = require("./common/services/sqs-idempotency.service");
const idempotency_module_1 = require("./common/modules/idempotency.module");
const appointments_controller_1 = require("./presentation/controllers/appointments.controller");
const injection_tokens_1 = require("./shared/constants/injection-tokens");
let AppointmentModule = class AppointmentModule {
};
exports.AppointmentModule = AppointmentModule;
exports.AppointmentModule = AppointmentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            enterprise_sqs_module_1.EnterpriseSqsModule,
            idempotency_module_1.IdempotencyModule,
        ],
        providers: [
            prisma_service_1.PrismaService,
            resilient_prisma_service_1.ResilientPrismaService,
            {
                provide: injection_tokens_1.INJECTION_TOKENS.MESSAGE_QUEUE,
                useClass: aws_sqs_producer_1.AwsSqsProducer,
            },
            {
                provide: injection_tokens_1.INJECTION_TOKENS.ENTERPRISE_MESSAGE_QUEUE,
                useClass: aws_sqs_producer_1.AwsSqsProducer,
            },
            saga_orchestrator_1.SagaOrchestrator,
            dlq_handler_1.DeadLetterQueueHandler,
            outbox_service_1.OutboxService,
            outbox_repository_1.OutboxRepository,
            {
                provide: injection_tokens_1.INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
                useClass: prisma_psychologist_repository_1.PrismaPsychologistRepository,
            },
            {
                provide: injection_tokens_1.INJECTION_TOKENS.PATIENT_REPOSITORY,
                useClass: prisma_patient_repository_1.PrismaPatientRepository,
            },
            {
                provide: injection_tokens_1.INJECTION_TOKENS.APPOINTMENT_REPOSITORY,
                useClass: prisma_appointment_repository_1.PrismaAppointmentRepository,
            },
            enterprise_schedule_appointment_use_case_1.EnterpriseScheduleAppointmentUseCase,
            list_appointments_use_case_1.ListAppointmentsUseCase,
            process_appointment_use_case_1.ProcessAppointmentUseCase,
            resilient_process_appointment_use_case_1.ResilientProcessAppointmentUseCase,
            sqs_idempotency_service_1.SQSIdempotencyService,
        ],
        controllers: [appointments_controller_1.AppointmentsController],
        exports: [
            prisma_service_1.PrismaService,
            resilient_prisma_service_1.ResilientPrismaService,
            injection_tokens_1.INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
            injection_tokens_1.INJECTION_TOKENS.PATIENT_REPOSITORY,
            injection_tokens_1.INJECTION_TOKENS.APPOINTMENT_REPOSITORY,
            injection_tokens_1.INJECTION_TOKENS.MESSAGE_QUEUE,
            injection_tokens_1.INJECTION_TOKENS.ENTERPRISE_MESSAGE_QUEUE,
            enterprise_schedule_appointment_use_case_1.EnterpriseScheduleAppointmentUseCase,
            resilient_process_appointment_use_case_1.ResilientProcessAppointmentUseCase,
            saga_orchestrator_1.SagaOrchestrator,
            dlq_handler_1.DeadLetterQueueHandler,
            outbox_service_1.OutboxService,
        ],
    })
], AppointmentModule);
//# sourceMappingURL=appointment.module.js.map