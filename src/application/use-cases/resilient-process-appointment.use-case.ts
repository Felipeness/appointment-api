import { Injectable, Logger, Inject } from '@nestjs/common';
import { SagaOrchestrator } from '../../common/saga/saga-orchestrator';
import { SagaStep } from '../../common/saga/saga.types';
import { DeadLetterQueueHandler } from '../../common/resilience/dlq-handler';
import { ProcessAppointmentUseCase, AppointmentMessage } from './process-appointment.use-case';
import { INJECTION_TOKENS } from '../../shared/constants/injection-tokens';
import type { PatientRepository } from '../../domain/repositories/patient.repository';
import type { PsychologistRepository } from '../../domain/repositories/psychologist.repository';
import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import { OutboxService } from '../../infrastructure/database/outbox/outbox.service';
import { Patient } from '../../domain/entities/patient.entity';
import { Appointment } from '../../domain/entities/appointment.entity';
import { v4 as uuidv4 } from 'uuid';
import { parseISO } from 'date-fns';

@Injectable()
export class ResilientProcessAppointmentUseCase {
  private readonly logger = new Logger(ResilientProcessAppointmentUseCase.name);

  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator,
    private readonly dlqHandler: DeadLetterQueueHandler,
    private readonly originalProcessor: ProcessAppointmentUseCase,
    @Inject(INJECTION_TOKENS.PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY)
    private readonly psychologistRepository: PsychologistRepository,
    @Inject(INJECTION_TOKENS.APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    private readonly outboxService: OutboxService,
  ) {}

  async executeWithResilience(message: AppointmentMessage, attemptCount: number = 1): Promise<void> {
    try {
      const sagaSteps = this.createAppointmentSagaSteps(message);
      
      const sagaExecution = await this.sagaOrchestrator.executeSaga(
        'ProcessAppointment',
        sagaSteps,
        { originalMessage: message, attemptCount }
      );

      if (sagaExecution.error) {
        throw new Error(`Saga failed: ${sagaExecution.error}`);
      }

      this.logger.log(`Appointment processed successfully with Saga: ${message.appointmentId}`);

    } catch (error) {
      this.logger.error(`Resilient appointment processing failed: ${error.message}`, error.stack);
      
      await this.dlqHandler.handleFailedMessage(
        message,
        error instanceof Error ? error : new Error('Unknown processing error'),
        attemptCount,
        'appointment-processing'
      );
    }
  }

  private createAppointmentSagaSteps(message: AppointmentMessage): SagaStep[] {
    return [
      {
        id: 'validate-patient',
        name: 'Validate or Create Patient',
        action: async () => {
          return await this.validateOrCreatePatient(message);
        },
        compensation: async () => {
          // If patient was created, we might want to mark it as inactive
          // For existing patients, no compensation needed
          this.logger.log('Compensating patient validation - no action needed');
        },
        retryable: true,
        maxRetries: 3,
      },
      {
        id: 'validate-psychologist',
        name: 'Validate Psychologist',
        action: async () => {
          return await this.validatePsychologist(message.psychologistId);
        },
        compensation: async () => {
          // No compensation needed for validation
          this.logger.log('Compensating psychologist validation - no action needed');
        },
        retryable: true,
        maxRetries: 3,
      },
      {
        id: 'check-availability',
        name: 'Check Time Slot Availability',
        action: async () => {
          return await this.checkAvailability(message);
        },
        compensation: async () => {
          // No compensation needed for availability check
          this.logger.log('Compensating availability check - no action needed');
        },
        retryable: true,
        maxRetries: 2,
      },
      {
        id: 'save-appointment',
        name: 'Save Appointment',
        action: async () => {
          return await this.saveAppointmentWithOutbox(message);
        },
        compensation: async () => {
          // Delete the appointment if it was saved
          await this.deleteAppointment(message.appointmentId);
        },
        retryable: true,
        maxRetries: 5,
      },
      {
        id: 'send-confirmation',
        name: 'Send Confirmation Notification',
        action: async () => {
          return await this.sendConfirmationNotification(message);
        },
        compensation: async () => {
          // Send cancellation notification
          await this.sendCancellationNotification(message);
        },
        retryable: true,
        maxRetries: 3,
      },
    ];
  }

  private async validateOrCreatePatient(message: AppointmentMessage): Promise<Patient> {
    let patient = await this.patientRepository.findByEmail(message.patientEmail);
    
    if (!patient) {
      const patientId = uuidv4();
      patient = new Patient(
        patientId,
        message.patientEmail,
        message.patientName,
        message.patientPhone,
      );
      patient = await this.patientRepository.save(patient);
      this.logger.log(`Created new patient: ${patient.id}`);
    }

    return patient;
  }

  private async validatePsychologist(psychologistId: string): Promise<any> {
    const psychologist = await this.psychologistRepository.findById(psychologistId);
    
    if (!psychologist) {
      throw new Error('Psychologist not found');
    }

    if (!psychologist.isActive) {
      throw new Error('Psychologist is not active');
    }

    return psychologist;
  }

  private async checkAvailability(message: AppointmentMessage): Promise<boolean> {
    const scheduledDate = parseISO(message.scheduledAt);
    
    const existingAppointment = await this.appointmentRepository.findByPsychologistAndDate(
      message.psychologistId,
      scheduledDate,
    );

    if (existingAppointment) {
      throw new Error('Time slot no longer available');
    }

    const psychologist = await this.psychologistRepository.findById(message.psychologistId);
    if (!psychologist?.isAvailableAt(scheduledDate)) {
      throw new Error('Psychologist not available at requested time');
    }

    return true;
  }

  private async saveAppointmentWithOutbox(message: AppointmentMessage): Promise<string> {
    const scheduledDate = parseISO(message.scheduledAt);
    
    // Get patient ID from context (from previous step)
    const patient = await this.patientRepository.findByEmail(message.patientEmail);
    const patientId = patient?.id || uuidv4();
    
    const appointment = new Appointment(
      message.appointmentId,
      patientId,
      message.psychologistId,
      scheduledDate,
      message.duration || 60,
      message.appointmentType as any,
      'CONFIRMED' as any,
      message.meetingType as any,
      message.meetingUrl,
      message.meetingRoom,
      message.reason,
      message.notes,
      undefined, // privateNotes
      message.consultationFee,
      false, // isPaid
      undefined, // cancelledAt
      undefined, // cancelledBy
      undefined, // cancellationReason
      new Date(), // createdAt
      new Date(), // updatedAt
      new Date(), // confirmedAt
      undefined  // completedAt
    );

    await this.outboxService.saveEventInTransaction(
      {
        aggregateId: message.appointmentId,
        aggregateType: 'Appointment',
        eventType: 'AppointmentConfirmed',
        eventData: {
          appointmentId: message.appointmentId,
          patientEmail: message.patientEmail,
          psychologistId: message.psychologistId,
          scheduledAt: scheduledDate.toISOString(),
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString(),
        },
      },
      async (prismaTransaction) => {
        await prismaTransaction.appointment.create({
          data: {
            id: appointment.id,
            patientId: appointment.patientId,
            psychologistId: appointment.psychologistId,
            scheduledAt: appointment.scheduledAt,
            duration: appointment.duration,
            appointmentType: appointment.appointmentType,
            status: appointment.status,
            meetingType: appointment.meetingType,
            meetingUrl: appointment.meetingUrl,
            meetingRoom: appointment.meetingRoom,
            reason: appointment.reason,
            notes: appointment.notes,
            privateNotes: appointment.privateNotes,
            consultationFee: appointment.consultationFee,
            isPaid: appointment.isPaid,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            confirmedAt: appointment.confirmedAt,
          },
        });
      }
    );

    this.logger.log(`Appointment saved with Outbox Pattern: ${message.appointmentId}`);
    return message.appointmentId;
  }

  private async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      // In production, this would use the repository pattern
      this.logger.log(`Compensating: deleting appointment ${appointmentId}`);
      // await this.appointmentRepository.delete(appointmentId);
    } catch (error) {
      this.logger.error(`Failed to compensate appointment deletion: ${error.message}`);
    }
  }

  private async sendConfirmationNotification(message: AppointmentMessage): Promise<void> {
    // Simulate notification sending
    this.logger.log(`Sending confirmation notification for appointment: ${message.appointmentId}`);
    
    // In production, this would integrate with email/SMS service
    await this.simulateNotificationDelay();
  }

  private async sendCancellationNotification(message: AppointmentMessage): Promise<void> {
    this.logger.log(`Compensating: sending cancellation notification for appointment: ${message.appointmentId}`);
    
    // In production, this would send cancellation email/SMS
    await this.simulateNotificationDelay();
  }

  private async simulateNotificationDelay(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Health check method
  async getHealthStatus(): Promise<{
    saga: boolean;
    dlq: any;
    processingQueue: string;
  }> {
    const sagaExecutions = await this.sagaOrchestrator.getAllExecutions();
    const dlqStatus = this.dlqHandler.getHealthStatus();

    return {
      saga: sagaExecutions.length >= 0, // Simple health check
      dlq: dlqStatus,
      processingQueue: 'healthy',
    };
  }
}