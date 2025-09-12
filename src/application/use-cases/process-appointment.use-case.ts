import { Injectable, Logger, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { parseISO } from 'date-fns';

import { Appointment } from '../../domain/entities/appointment.entity';
import { Patient } from '../../domain/entities/patient.entity';
import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import type { PatientRepository } from '../../domain/repositories/patient.repository';
import type { PsychologistRepository } from '../../domain/repositories/psychologist.repository';
import { OutboxService } from '../../infrastructure/database/outbox/outbox.service';
import { INJECTION_TOKENS } from '../../shared/constants/injection-tokens';
import {
  AppointmentType,
  AppointmentStatus,
  MeetingType,
} from '../../domain/entities/enums';

export interface AppointmentMessage {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  patientPhone?: string;
  psychologistId: string;
  scheduledAt: string;
  duration?: number;
  appointmentType?: string;
  meetingType?: string;
  meetingUrl?: string;
  meetingRoom?: string;
  reason?: string;
  notes?: string;
  consultationFee?: number;
}

@Injectable()
export class ProcessAppointmentUseCase {
  private readonly logger = new Logger(ProcessAppointmentUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    @Inject(INJECTION_TOKENS.PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY)
    private readonly psychologistRepository: PsychologistRepository,
    private readonly outboxService: OutboxService,
  ) {}

  async execute(message: AppointmentMessage): Promise<void> {
    try {
      const {
        appointmentId,
        psychologistId,
        scheduledAt,
        patientEmail,
        patientName,
        patientPhone,
      } = message;

      const scheduledDate = parseISO(scheduledAt);

      // Find or create patient
      let patient = await this.patientRepository.findByEmail(patientEmail);
      if (!patient) {
        patient = new Patient(
          uuidv4(),
          patientEmail,
          patientName,
          patientPhone,
        );
        patient = await this.patientRepository.save(patient);
        this.logger.log(`Created new patient: ${patient.id}`);
      }

      // Validate psychologist exists and is active
      const psychologist =
        await this.psychologistRepository.findById(psychologistId);
      if (!psychologist) {
        await this.declineAppointment(
          appointmentId,
          patient.id,
          psychologistId,
          scheduledDate,
          'Psychologist not found',
        );
        return;
      }

      if (!psychologist.isActive) {
        await this.declineAppointment(
          appointmentId,
          patient.id,
          psychologistId,
          scheduledDate,
          'Psychologist is not active',
        );
        return;
      }

      // Check availability at processing time (not scheduling time)
      const existingAppointment =
        await this.appointmentRepository.findByPsychologistAndDate(
          psychologistId,
          scheduledDate,
        );

      if (existingAppointment) {
        await this.declineAppointment(
          appointmentId,
          patient.id,
          psychologistId,
          scheduledDate,
          'Time slot no longer available',
        );
        return;
      }

      if (!psychologist.isAvailableAt(scheduledDate)) {
        await this.declineAppointment(
          appointmentId,
          patient.id,
          psychologistId,
          scheduledDate,
          'Psychologist not available at requested time',
        );
        return;
      }

      // All validations passed - confirm appointment
      const confirmedAppointment = new Appointment(
        appointmentId,
        patient.id,
        psychologistId,
        scheduledDate,
        message.duration || 60,
        (message.appointmentType as AppointmentType) ||
          AppointmentType.CONSULTATION,
        AppointmentStatus.CONFIRMED,
        (message.meetingType as MeetingType) || MeetingType.IN_PERSON,
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
        undefined, // completedAt
      );

      // Use Outbox Pattern for atomic save + event publishing
      await this.outboxService.saveEventInTransaction(
        {
          aggregateId: appointmentId,
          aggregateType: 'Appointment',
          eventType: 'AppointmentConfirmed',
          eventData: {
            appointmentId,
            patientId: patient.id,
            psychologistId,
            scheduledAt: scheduledDate.toISOString(),
            status: 'CONFIRMED',
            confirmedAt: new Date().toISOString(),
          },
        },
        async (prismaTransaction) => {
          // Save appointment within transaction
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await prismaTransaction.appointment.create({
            data: {
              id: confirmedAppointment.id,
              patientId: confirmedAppointment.patientId,
              psychologistId: confirmedAppointment.psychologistId,
              scheduledAt: confirmedAppointment.scheduledAt,
              duration: confirmedAppointment.duration,
              appointmentType: confirmedAppointment.appointmentType,
              status: confirmedAppointment.status,
              meetingType: confirmedAppointment.meetingType,
              meetingUrl: confirmedAppointment.meetingUrl,
              meetingRoom: confirmedAppointment.meetingRoom,
              reason: confirmedAppointment.reason,
              notes: confirmedAppointment.notes,
              privateNotes: confirmedAppointment.privateNotes,
              consultationFee: confirmedAppointment.consultationFee,
              isPaid: confirmedAppointment.isPaid,
              createdAt: confirmedAppointment.createdAt,
              updatedAt: confirmedAppointment.updatedAt,
              confirmedAt: confirmedAppointment.confirmedAt,
            },
          });
        },
      );

      this.logger.log(
        `Appointment confirmed using Outbox Pattern: ${appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async declineAppointment(
    appointmentId: string,
    patientId: string,
    psychologistId: string,
    scheduledDate: Date,
    reason: string,
  ): Promise<void> {
    const declinedAppointment = new Appointment(
      appointmentId,
      patientId,
      psychologistId,
      scheduledDate,
      60, // default duration
      AppointmentType.CONSULTATION,
      AppointmentStatus.DECLINED,
      MeetingType.IN_PERSON,
      undefined, // meetingUrl
      undefined, // meetingRoom
      undefined, // reason
      undefined, // notes
      undefined, // privateNotes
      undefined, // consultationFee
      false, // isPaid
      undefined, // cancelledAt
      undefined, // cancelledBy
      undefined, // cancellationReason
      new Date(), // createdAt
      new Date(), // updatedAt
      undefined, // confirmedAt
      undefined, // completedAt
    );

    // Use Outbox Pattern for declined appointments too
    await this.outboxService.saveEventInTransaction(
      {
        aggregateId: appointmentId,
        aggregateType: 'Appointment',
        eventType: 'AppointmentDeclined',
        eventData: {
          appointmentId,
          patientId,
          psychologistId,
          scheduledAt: scheduledDate.toISOString(),
          status: 'DECLINED',
          declineReason: reason,
          declinedAt: new Date().toISOString(),
        },
      },
      async (prismaTransaction) => {
        // Save declined appointment within transaction
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await prismaTransaction.appointment.create({
          data: {
            id: declinedAppointment.id,
            patientId: declinedAppointment.patientId,
            psychologistId: declinedAppointment.psychologistId,
            scheduledAt: declinedAppointment.scheduledAt,
            duration: declinedAppointment.duration,
            appointmentType: declinedAppointment.appointmentType,
            status: declinedAppointment.status,
            meetingType: declinedAppointment.meetingType,
            createdAt: declinedAppointment.createdAt,
            updatedAt: declinedAppointment.updatedAt,
          },
        });
      },
    );

    this.logger.warn(
      `Appointment declined using Outbox Pattern: ${appointmentId} - ${reason}`,
    );
    await this.sendNotification(patientId, 'declined', reason);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async sendNotification(
    patientId: string,
    status: string,
    message: string,
  ): Promise<void> {
    this.logger.log(
      `Notification sent to patient ${patientId}: ${status} - ${message}`,
    );
  }
}
