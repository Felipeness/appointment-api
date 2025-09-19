import { SagaOrchestrator } from '../../common/saga/saga-orchestrator';
import { DeadLetterQueueHandler } from '../../common/resilience/dlq-handler';
import { ProcessAppointmentUseCase, AppointmentMessage } from './process-appointment.use-case';
import type { PatientRepository } from '../../domain/repositories/patient.repository';
import type { PsychologistRepository } from '../../domain/repositories/psychologist.repository';
import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import { OutboxService } from '../../infrastructure/database/outbox/outbox.service';
export declare class ResilientProcessAppointmentUseCase {
    private readonly sagaOrchestrator;
    private readonly dlqHandler;
    private readonly originalProcessor;
    private readonly patientRepository;
    private readonly psychologistRepository;
    private readonly appointmentRepository;
    private readonly outboxService;
    private readonly logger;
    constructor(sagaOrchestrator: SagaOrchestrator, dlqHandler: DeadLetterQueueHandler, originalProcessor: ProcessAppointmentUseCase, patientRepository: PatientRepository, psychologistRepository: PsychologistRepository, appointmentRepository: AppointmentRepository, outboxService: OutboxService);
    executeWithResilience(message: AppointmentMessage, attemptCount?: number): Promise<void>;
    private createAppointmentSagaSteps;
    private validateOrCreatePatient;
    private validatePsychologist;
    private checkAvailability;
    private saveAppointmentWithOutbox;
    private deleteAppointment;
    private sendConfirmationNotification;
    private sendCancellationNotification;
    private simulateNotificationDelay;
    getHealthStatus(): {
        saga: boolean;
        dlq: Record<string, unknown>;
        processingQueue: string;
    };
}
