import { Injectable, Logger, Inject } from '@nestjs/common';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { EnterpriseAppointmentProducer } from '../../infrastructure/messaging/enterprise-appointment.producer';
import type { PsychologistRepository } from '../../domain/repositories/psychologist.repository';
import { INJECTION_TOKENS } from '../../shared/constants/injection-tokens';
import { PsychologistNotFoundException } from '../../common/exceptions/domain.exceptions';
import { v4 as uuidv4 } from 'uuid';
import { addHours, isBefore } from 'date-fns';

export interface EnterpriseScheduleResult {
  appointmentId: string;
  status: 'queued' | 'failed';
  queuedAt: string;
  estimatedProcessingTime?: string;
  traceId: string;
  priority: 'high' | 'normal' | 'low';
}

@Injectable()
export class EnterpriseScheduleAppointmentUseCase {
  private readonly logger = new Logger(
    EnterpriseScheduleAppointmentUseCase.name,
  );

  constructor(
    @Inject(INJECTION_TOKENS.ENTERPRISE_MESSAGE_QUEUE)
    private readonly enterpriseQueue: EnterpriseAppointmentProducer,
    @Inject(INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY)
    private readonly psychologistRepository: PsychologistRepository,
  ) {}

  async execute(
    dto: CreateAppointmentDto,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      traceId?: string;
      userId?: string;
    },
  ): Promise<EnterpriseScheduleResult> {
    const appointmentId = uuidv4();
    const traceId = options?.traceId || this.generateTraceId();
    const priority = this.determinePriority(dto, options?.priority);

    this.logger.log(`Starting enterprise appointment scheduling`, {
      appointmentId,
      traceId,
      priority,
      patientEmail: dto.patientEmail,
      psychologistId: dto.psychologistId,
    });

    try {
      // Fast validation before queuing (fail fast principle)
      await this.performPreQueueValidation(dto, traceId);

      // Create enterprise message with rich metadata
      const appointmentMessage = {
        appointmentId,
        patientEmail: dto.patientEmail,
        patientName: dto.patientName,
        patientPhone: dto.patientPhone,
        psychologistId: dto.psychologistId,
        scheduledAt: dto.scheduledAt,
        duration: dto.duration || 60,
        appointmentType: dto.appointmentType,
        meetingType: dto.meetingType,
        meetingUrl: dto.meetingUrl,
        meetingRoom: dto.meetingRoom,
        reason: dto.reason,
        notes: dto.notes,
        consultationFee: dto.consultationFee,
      };

      // Send to enterprise queue with advanced options
      await this.enterpriseQueue.sendMessage(appointmentMessage, {
        priority,
        traceId,
        messageGroupId: this.getMessageGroupId(dto),
        deduplicationId: this.getDeduplicationId(appointmentId, dto),
        delaySeconds: this.calculateDelaySeconds(priority),
      });

      const result: EnterpriseScheduleResult = {
        appointmentId,
        status: 'queued',
        queuedAt: new Date().toISOString(),
        estimatedProcessingTime: this.estimateProcessingTime(priority),
        traceId,
        priority,
      };

      this.logger.log(`Appointment successfully queued for processing`, {
        appointmentId,
        traceId,
        priority,
        estimatedProcessingTime: result.estimatedProcessingTime,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to queue appointment`, {
        appointmentId,
        traceId,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      return {
        appointmentId,
        status: 'failed',
        queuedAt: new Date().toISOString(),
        traceId,
        priority,
      };
    }
  }

  private async performPreQueueValidation(
    dto: CreateAppointmentDto,
    traceId: string,
  ): Promise<void> {
    // 1. Validate psychologist exists (quick check)
    const psychologist = await this.psychologistRepository.findById(
      dto.psychologistId,
    );
    if (!psychologist) {
      throw new PsychologistNotFoundException(dto.psychologistId);
    }

    if (!psychologist.isActive) {
      throw new PsychologistNotFoundException(
        `Psychologist ${dto.psychologistId} is not active`,
      );
    }

    // 2. Validate 24-hour advance booking rule
    const scheduledTime = new Date(dto.scheduledAt);
    const minimumBookingTime = addHours(new Date(), 24);

    if (isBefore(scheduledTime, minimumBookingTime)) {
      throw new Error(
        'Appointments must be scheduled at least 24 hours in advance',
      );
    }

    this.logger.debug(`Pre-queue validation passed`, {
      psychologistId: dto.psychologistId,
      scheduledAt: dto.scheduledAt,
      traceId,
    });
  }

  private determinePriority(
    dto: CreateAppointmentDto,
    requestedPriority?: string,
  ): 'high' | 'normal' | 'low' {
    // Business logic to determine message priority
    if (requestedPriority === 'high') return 'high';

    // VIP patients or urgent appointments get high priority
    if (
      dto.appointmentType === ('EMERGENCY' as any) ||
      dto.reason?.toLowerCase().includes('urgent')
    ) {
      return 'high';
    }

    // Follow-up appointments get normal priority
    if (dto.appointmentType === ('FOLLOW_UP' as any)) {
      return 'normal';
    }

    // Regular consultations get low priority (processed in order)
    return 'low';
  }

  private getMessageGroupId(dto: CreateAppointmentDto): string {
    // Group messages by psychologist to ensure ordered processing per psychologist
    return `psychologist-${dto.psychologistId}`;
  }

  private getDeduplicationId(
    appointmentId: string,
    dto: CreateAppointmentDto,
  ): string {
    // Prevent duplicate appointments for same patient+psychologist+time
    const dedupeKey = `${dto.patientEmail}-${dto.psychologistId}-${dto.scheduledAt}`;
    return `${appointmentId}-${Buffer.from(dedupeKey).toString('base64')}`;
  }

  private calculateDelaySeconds(priority: string): number {
    switch (priority) {
      case 'high':
        return 0; // Process immediately
      case 'normal':
        return 5; // Small delay to batch normal priority
      case 'low':
        return 10; // Longer delay for low priority
      default:
        return 5;
    }
  }

  private estimateProcessingTime(priority: string): string {
    const baseTime = new Date();
    let estimatedMinutes: number;

    switch (priority) {
      case 'high':
        estimatedMinutes = 1;
        break;
      case 'normal':
        estimatedMinutes = 5;
        break;
      case 'low':
        estimatedMinutes = 15;
        break;
      default:
        estimatedMinutes = 5;
    }

    baseTime.setMinutes(baseTime.getMinutes() + estimatedMinutes);
    return baseTime.toISOString();
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Batch scheduling for high-volume scenarios
  async executeBatch(
    appointments: CreateAppointmentDto[],
    options?: {
      priority?: 'high' | 'normal' | 'low';
      traceId?: string;
      batchId?: string;
    },
  ): Promise<EnterpriseScheduleResult[]> {
    const batchId = options?.batchId || uuidv4();
    const traceId = options?.traceId || this.generateTraceId();

    this.logger.log(`Starting batch appointment scheduling`, {
      batchId,
      traceId,
      appointmentCount: appointments.length,
    });

    const results: EnterpriseScheduleResult[] = [];

    // Process in batches of 10 (AWS SQS limit)
    for (let i = 0; i < appointments.length; i += 10) {
      const batch = appointments.slice(i, i + 10);
      const batchResults = await Promise.allSettled(
        batch.map((dto) =>
          this.execute(dto, {
            ...options,
            traceId: `${traceId}-${i / 10 + 1}`,
          }),
        ),
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create failed result
          results.push({
            appointmentId: uuidv4(),
            status: 'failed',
            queuedAt: new Date().toISOString(),
            traceId,
            priority: options?.priority || 'normal',
          });

          this.logger.error(`Batch appointment failed`, {
            batchId,
            traceId,
            appointmentIndex: i + index,
            error:
              result && typeof result === 'object' && 'reason' in result
                ? (result as { reason: unknown }).reason
                : 'Unknown error',
          });
        }
      });
    }

    this.logger.log(`Batch appointment scheduling completed`, {
      batchId,
      traceId,
      successful: results.filter((r) => r.status === 'queued').length,
      failed: results.filter((r) => r.status === 'failed').length,
    });

    return results;
  }
}
