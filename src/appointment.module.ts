import { Module } from '@nestjs/common';

import { PrismaService } from './infrastructure/database/prisma.service';
import { ResilientPrismaService } from './infrastructure/database/resilient-prisma.service';

// Enterprise SQS implementation
import { EnterpriseSqsModule } from './infrastructure/messaging/enterprise-sqs.module';
import { AwsSqsProducer } from './infrastructure/messaging/aws-sqs.producer';
// import { EnterpriseAppointmentConsumer } from './infrastructure/messaging/enterprise-appointment.consumer';

// Resilience components
import { SagaOrchestrator } from './common/saga/saga-orchestrator';
import { DeadLetterQueueHandler } from './common/resilience/dlq-handler';
import { OutboxService } from './infrastructure/database/outbox/outbox.service';
import { OutboxRepository } from './infrastructure/database/outbox/outbox.repository';

import { PrismaPsychologistRepository } from './infrastructure/database/repositories/prisma-psychologist.repository';
import { PrismaPatientRepository } from './infrastructure/database/repositories/prisma-patient.repository';
import { PrismaAppointmentRepository } from './infrastructure/database/repositories/prisma-appointment.repository';

import { EnterpriseScheduleAppointmentUseCase } from './application/use-cases/enterprise-schedule-appointment.use-case';
import { ListAppointmentsUseCase } from './application/use-cases/list-appointments.use-case';
import { ProcessAppointmentUseCase } from './application/use-cases/process-appointment.use-case';
import { ResilientProcessAppointmentUseCase } from './application/use-cases/resilient-process-appointment.use-case';

// Additional services for SQS consumer
import { SQSIdempotencyService } from './common/services/sqs-idempotency.service';
import { IdempotencyModule } from './common/modules/idempotency.module';

import { AppointmentsController } from './presentation/controllers/appointments.controller';
import { INJECTION_TOKENS } from './shared/constants/injection-tokens';

@Module({
  imports: [
    // Import enterprise SQS module for advanced queue processing
    EnterpriseSqsModule,
    // Import idempotency module for interceptors
    IdempotencyModule,
  ],
  providers: [
    // Database services
    PrismaService,
    ResilientPrismaService,

    // Enterprise SQS as the primary message queue service
    {
      provide: INJECTION_TOKENS.MESSAGE_QUEUE,
      useClass: AwsSqsProducer,
    },
    {
      provide: INJECTION_TOKENS.ENTERPRISE_MESSAGE_QUEUE,
      useClass: AwsSqsProducer,
    },

    // Resilience components
    SagaOrchestrator,
    DeadLetterQueueHandler,
    OutboxService,
    OutboxRepository,

    // Repository implementations
    {
      provide: INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
      useClass: PrismaPsychologistRepository,
    },
    {
      provide: INJECTION_TOKENS.PATIENT_REPOSITORY,
      useClass: PrismaPatientRepository,
    },
    {
      provide: INJECTION_TOKENS.APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },

    // Use case implementations
    EnterpriseScheduleAppointmentUseCase,
    ListAppointmentsUseCase,
    ProcessAppointmentUseCase,
    ResilientProcessAppointmentUseCase,

    // SQS Consumer and its dependencies (temporarily disabled while testing new producer)
    // EnterpriseAppointmentConsumer,
    SQSIdempotencyService,
  ],
  controllers: [AppointmentsController],
  exports: [
    // Core services
    PrismaService,
    ResilientPrismaService,

    // Repository tokens
    INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
    INJECTION_TOKENS.PATIENT_REPOSITORY,
    INJECTION_TOKENS.APPOINTMENT_REPOSITORY,

    // Queue service (now enterprise only)
    INJECTION_TOKENS.MESSAGE_QUEUE,
    INJECTION_TOKENS.ENTERPRISE_MESSAGE_QUEUE,

    // Use cases
    EnterpriseScheduleAppointmentUseCase,
    ResilientProcessAppointmentUseCase,

    // Resilience components
    SagaOrchestrator,
    DeadLetterQueueHandler,
    OutboxService,
  ],
})
export class AppointmentModule {}
