import { addHours, isBefore } from 'date-fns';
import { AppointmentStatus, AppointmentType, MeetingType } from './enums';

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly psychologistId: string,
    public readonly scheduledAt: Date,
    public readonly duration: number = 60,
    public readonly appointmentType: AppointmentType = AppointmentType.CONSULTATION,
    public readonly status: AppointmentStatus = AppointmentStatus.PENDING,
    public readonly meetingType: MeetingType = MeetingType.IN_PERSON,
    public readonly meetingUrl?: string,
    public readonly meetingRoom?: string,
    public readonly reason?: string,
    public readonly notes?: string,
    public readonly privateNotes?: string,
    public readonly consultationFee?: number,
    public readonly isPaid: boolean = false,
    public readonly cancelledAt?: Date,
    public readonly cancelledBy?: string,
    public readonly cancellationReason?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly confirmedAt?: Date,
    public readonly completedAt?: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Appointment ID is required');
    }

    if (!this.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!this.psychologistId) {
      throw new Error('Psychologist ID is required');
    }

    if (!this.scheduledAt) {
      throw new Error('Scheduled date and time is required');
    }

    if (this.patientId === this.psychologistId) {
      throw new Error('Patient and psychologist cannot be the same person');
    }
  }

  public isScheduledWithin24Hours(): boolean {
    const twentyFourHoursFromNow = addHours(new Date(), 24);
    return isBefore(this.scheduledAt, twentyFourHoursFromNow);
  }

  public isPast(): boolean {
    return isBefore(this.scheduledAt, new Date());
  }

  public canBeConfirmed(): boolean {
    return this.status === AppointmentStatus.PENDING && !this.isPast();
  }

  public canBeDeclined(): boolean {
    return this.status === AppointmentStatus.PENDING && !this.isPast();
  }

  public canBeCancelled(): boolean {
    return (
      (this.status === AppointmentStatus.CONFIRMED ||
        this.status === AppointmentStatus.PENDING) &&
      !this.isPast()
    );
  }

  public canBeCompleted(): boolean {
    return this.status === AppointmentStatus.CONFIRMED && this.isPast();
  }

  public confirm(notes?: string): Appointment {
    if (!this.canBeConfirmed()) {
      throw new Error('Appointment cannot be confirmed in current state');
    }

    return new Appointment(
      this.id,
      this.patientId,
      this.psychologistId,
      this.scheduledAt,
      this.duration,
      this.appointmentType,
      AppointmentStatus.CONFIRMED,
      this.meetingType,
      this.meetingUrl,
      this.meetingRoom,
      this.reason,
      notes ?? this.notes,
      this.privateNotes,
      this.consultationFee,
      this.isPaid,
      this.cancelledAt,
      this.cancelledBy,
      this.cancellationReason,
      this.createdAt,
      new Date(),
      new Date(), // confirmedAt
      this.completedAt,
    );
  }

  public decline(notes?: string): Appointment {
    if (!this.canBeDeclined()) {
      throw new Error('Appointment cannot be declined in current state');
    }

    return new Appointment(
      this.id,
      this.patientId,
      this.psychologistId,
      this.scheduledAt,
      this.duration,
      this.appointmentType,
      AppointmentStatus.DECLINED,
      this.meetingType,
      this.meetingUrl,
      this.meetingRoom,
      this.reason,
      notes ?? this.notes,
      this.privateNotes,
      this.consultationFee,
      this.isPaid,
      this.cancelledAt,
      this.cancelledBy,
      this.cancellationReason,
      this.createdAt,
      new Date(),
      this.confirmedAt,
      this.completedAt,
    );
  }

  public cancel(cancelledBy: string, reason?: string): Appointment {
    if (!this.canBeCancelled()) {
      throw new Error('Appointment cannot be cancelled in current state');
    }

    return new Appointment(
      this.id,
      this.patientId,
      this.psychologistId,
      this.scheduledAt,
      this.duration,
      this.appointmentType,
      AppointmentStatus.CANCELLED,
      this.meetingType,
      this.meetingUrl,
      this.meetingRoom,
      this.reason,
      this.notes,
      this.privateNotes,
      this.consultationFee,
      this.isPaid,
      new Date(), // cancelledAt
      cancelledBy,
      reason,
      this.createdAt,
      new Date(),
      this.confirmedAt,
      this.completedAt,
    );
  }

  public complete(notes?: string): Appointment {
    if (!this.canBeCompleted()) {
      throw new Error('Appointment cannot be completed in current state');
    }

    return new Appointment(
      this.id,
      this.patientId,
      this.psychologistId,
      this.scheduledAt,
      this.duration,
      this.appointmentType,
      AppointmentStatus.COMPLETED,
      this.meetingType,
      this.meetingUrl,
      this.meetingRoom,
      this.reason,
      notes ?? this.notes,
      this.privateNotes,
      this.consultationFee,
      this.isPaid,
      this.cancelledAt,
      this.cancelledBy,
      this.cancellationReason,
      this.createdAt,
      new Date(),
      this.confirmedAt,
      new Date(), // completedAt
    );
  }
}
