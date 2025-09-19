import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { AwsSqsProducer } from '../../infrastructure/messaging/aws-sqs.producer';
import type { PsychologistRepository } from '../../domain/repositories/psychologist.repository';
export interface EnterpriseScheduleResult {
    appointmentId: string;
    status: 'queued' | 'failed';
    queuedAt: string;
    estimatedProcessingTime?: string;
    traceId: string;
    priority: 'high' | 'normal' | 'low';
}
export declare class EnterpriseScheduleAppointmentUseCase {
    private readonly enterpriseQueue;
    private readonly psychologistRepository;
    private readonly logger;
    constructor(enterpriseQueue: AwsSqsProducer, psychologistRepository: PsychologistRepository);
    execute(dto: CreateAppointmentDto, options?: {
        priority?: 'high' | 'normal' | 'low';
        traceId?: string;
        userId?: string;
    }): Promise<EnterpriseScheduleResult>;
    private performPreQueueValidation;
    private determinePriority;
    private getMessageGroupId;
    private getDeduplicationId;
    private calculateDelaySeconds;
    private estimateProcessingTime;
    private generateTraceId;
    executeBatch(appointments: CreateAppointmentDto[], options?: {
        priority?: 'high' | 'normal' | 'low';
        traceId?: string;
        batchId?: string;
    }): Promise<EnterpriseScheduleResult[]>;
}
