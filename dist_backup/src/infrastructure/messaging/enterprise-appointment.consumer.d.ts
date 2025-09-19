import type { Message } from '@aws-sdk/client-sqs';
import { ResilientProcessAppointmentUseCase } from '../../application/use-cases/resilient-process-appointment.use-case';
import { DeadLetterQueueHandler } from '../../common/resilience/dlq-handler';
import { ProcessAppointmentUseCase } from '../../application/use-cases/process-appointment.use-case';
import { SQSIdempotencyService } from '../../common/services/sqs-idempotency.service';
export declare class EnterpriseAppointmentConsumer {
    private readonly resilientProcessor;
    private readonly processAppointmentUseCase;
    private readonly dlqHandler;
    private readonly sqsIdempotencyService;
    private readonly logger;
    constructor(resilientProcessor: ResilientProcessAppointmentUseCase, processAppointmentUseCase: ProcessAppointmentUseCase, dlqHandler: DeadLetterQueueHandler, sqsIdempotencyService: SQSIdempotencyService);
    handleAppointmentMessage(message: Message): Promise<void>;
    private processEnterpriseMessage;
    private processLegacyMessage;
    onProcessingError(error: Error, message: Message): void;
    onError(error: Error, message?: Message): void;
    onTimeoutError(error: Error, message: Message): void;
    onMessageReceived(message: Message): void;
    onMessageProcessed(message: Message): void;
    private extractTraceId;
    private extractMessageType;
    private isEnterpriseMessage;
    private getAttemptCount;
    getConsumerStatus(): {
        isHealthy: boolean;
        lastProcessedAt?: string;
        messagesProcessed: number;
        errors: number;
    };
}
