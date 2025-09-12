import { BaseDomainEvent } from '../base/domain-event.base';
import { AppointmentId } from '../value-objects/appointment-id.vo';
import { PatientId } from '../value-objects/patient-id.vo';
import { PsychologistId } from '../value-objects/psychologist-id.vo';

export class AppointmentScheduledEvent extends BaseDomainEvent {
  public readonly patientId: PatientId;
  public readonly psychologistId: PsychologistId;
  public readonly scheduledAt: Date;
  public readonly duration: number;

  constructor(
    appointmentId: AppointmentId,
    patientId: PatientId,
    psychologistId: PsychologistId,
    scheduledAt: Date,
    duration: number,
    version: number = 1
  ) {
    super(appointmentId.toString(), version);
    this.patientId = patientId;
    this.psychologistId = psychologistId;
    this.scheduledAt = scheduledAt;
    this.duration = duration;
  }
}

export class AppointmentConfirmedEvent extends BaseDomainEvent {
  public readonly confirmedAt: Date;
  public readonly notes?: string;

  constructor(
    appointmentId: AppointmentId,
    confirmedAt: Date,
    notes?: string,
    version: number = 1
  ) {
    super(appointmentId.toString(), version);
    this.confirmedAt = confirmedAt;
    this.notes = notes;
  }
}

export class AppointmentCancelledEvent extends BaseDomainEvent {
  public readonly cancelledAt: Date;
  public readonly cancelledBy: string;
  public readonly reason?: string;

  constructor(
    appointmentId: AppointmentId,
    cancelledAt: Date,
    cancelledBy: string,
    reason?: string,
    version: number = 1
  ) {
    super(appointmentId.toString(), version);
    this.cancelledAt = cancelledAt;
    this.cancelledBy = cancelledBy;
    this.reason = reason;
  }
}

export class AppointmentCompletedEvent extends BaseDomainEvent {
  public readonly completedAt: Date;
  public readonly notes?: string;

  constructor(
    appointmentId: AppointmentId,
    completedAt: Date,
    notes?: string,
    version: number = 1
  ) {
    super(appointmentId.toString(), version);
    this.completedAt = completedAt;
    this.notes = notes;
  }
}

export class AppointmentDeclinedEvent extends BaseDomainEvent {
  public readonly declinedAt: Date;
  public readonly notes?: string;

  constructor(
    appointmentId: AppointmentId,
    declinedAt: Date,
    notes?: string,
    version: number = 1
  ) {
    super(appointmentId.toString(), version);
    this.declinedAt = declinedAt;
    this.notes = notes;
  }
}