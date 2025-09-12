import { z } from 'zod';
import { AggregateRoot } from '../base/aggregate-root.base';
import { AppointmentId } from '../value-objects/appointment-id.vo';
import { PatientId } from '../value-objects/patient-id.vo';
import { PsychologistId } from '../value-objects/psychologist-id.vo';
import { DateService } from '../services/date.service';
import { 
  AppointmentScheduledEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentDeclinedEvent
} from '../events/appointment.events';
import { AppointmentStatus, AppointmentType, MeetingType } from '../entities/enums';

// Zod schemas for validation
const AppointmentPropsSchema = z.object({
  id: z.any(), // Temporarily any for compatibility
  patientId: z.any(), // Temporarily any for compatibility
  psychologistId: z.any(), // Temporarily any for compatibility
  scheduledAt: z.date().refine(date => date > new Date(), 'Appointment must be scheduled in the future'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(240, 'Duration cannot exceed 4 hours').default(60),
  appointmentType: z.nativeEnum(AppointmentType).default(AppointmentType.CONSULTATION),
  status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.PENDING),
  meetingType: z.nativeEnum(MeetingType).default(MeetingType.IN_PERSON),
  meetingUrl: z.string().url().optional(),
  meetingRoom: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  privateNotes: z.string().optional(),
  consultationFee: z.number().positive().optional(),
  isPaid: z.boolean().default(false),
  cancelledAt: z.date().optional(),
  cancelledBy: z.string().optional(),
  cancellationReason: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  confirmedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type AppointmentProps = z.infer<typeof AppointmentPropsSchema>;

export class Appointment extends AggregateRoot<AppointmentProps> {
  private constructor(props: AppointmentProps, version?: number) {
    super(props, props.id.toString(), version);
    this.validate();
  }

  public static create(props: Omit<AppointmentProps, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
    const appointmentProps: AppointmentProps = {
      ...props,
      id: AppointmentId.create(),
      createdAt: DateService.now(),
      updatedAt: DateService.now(),
    };

    // Validate with Zod
    const validatedProps = AppointmentPropsSchema.parse(appointmentProps);
    
    const appointment = new Appointment(validatedProps);
    
    // Add domain event
    appointment.addDomainEvent(
      new AppointmentScheduledEvent(
        validatedProps.id,
        validatedProps.patientId,
        validatedProps.psychologistId,
        validatedProps.scheduledAt,
        validatedProps.duration,
        appointment.version
      )
    );

    return appointment;
  }

  public static reconstitute(props: AppointmentProps, version: number): Appointment {
    return new Appointment(props, version);
  }

  private validate(): void {
    const props = this.props;

    if (!props.id) {
      throw new Error('Appointment ID is required');
    }

    if (!props.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!props.psychologistId) {
      throw new Error('Psychologist ID is required');
    }

    if (!props.scheduledAt) {
      throw new Error('Scheduled date and time is required');
    }

    if (props.patientId.equals(props.psychologistId)) {
      throw new Error('Patient and psychologist cannot be the same person');
    }

    // Meeting type specific validations
    if (props.meetingType === MeetingType.ONLINE && !props.meetingUrl) {
      throw new Error('Meeting URL is required for online appointments');
    }

    if (props.meetingType === MeetingType.IN_PERSON && !props.meetingRoom) {
      throw new Error('Meeting room is required for in-person appointments');
    }
  }

  // Getters
  public get appointmentId(): AppointmentId {
    return this.props.id;
  }

  public get patientId(): PatientId {
    return this.props.patientId;
  }

  public get psychologistId(): PsychologistId {
    return this.props.psychologistId;
  }

  public get scheduledAt(): Date {
    return this.props.scheduledAt;
  }

  public get status(): AppointmentStatus {
    return this.props.status;
  }

  public get duration(): number {
    return this.props.duration;
  }

  // Business logic methods
  public isScheduledWithin24Hours(): boolean {
    const twentyFourHoursFromNow = DateService.addHours(DateService.now(), 24);
    return DateService.isBefore(this.props.scheduledAt, twentyFourHoursFromNow);
  }

  public isPast(): boolean {
    return DateService.isBefore(this.props.scheduledAt, DateService.now());
  }

  public canBeConfirmed(): boolean {
    return this.props.status === AppointmentStatus.PENDING && !this.isPast();
  }

  public canBeDeclined(): boolean {
    return this.props.status === AppointmentStatus.PENDING && !this.isPast();
  }

  public canBeCancelled(): boolean {
    return (
      (this.props.status === AppointmentStatus.CONFIRMED ||
        this.props.status === AppointmentStatus.PENDING) &&
      !this.isPast()
    );
  }

  public canBeCompleted(): boolean {
    return this.props.status === AppointmentStatus.CONFIRMED && this.isPast();
  }

  // Command methods that emit domain events
  public confirm(notes?: string): void {
    if (!this.canBeConfirmed()) {
      throw new Error('Appointment cannot be confirmed in current state');
    }

    this.props.status = AppointmentStatus.CONFIRMED;
    this.props.confirmedAt = DateService.now();
    this.props.updatedAt = DateService.now();
    
    if (notes) {
      this.props.notes = notes;
    }

    this.addDomainEvent(
      new AppointmentConfirmedEvent(
        this.props.id,
        this.props.confirmedAt,
        notes,
        this.version
      )
    );
  }

  public decline(notes?: string): void {
    if (!this.canBeDeclined()) {
      throw new Error('Appointment cannot be declined in current state');
    }

    this.props.status = AppointmentStatus.DECLINED;
    this.props.updatedAt = DateService.now();
    
    if (notes) {
      this.props.notes = notes;
    }

    this.addDomainEvent(
      new AppointmentDeclinedEvent(
        this.props.id,
        DateService.now(),
        notes,
        this.version
      )
    );
  }

  public cancel(cancelledBy: string, reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Appointment cannot be cancelled in current state');
    }

    this.props.status = AppointmentStatus.CANCELLED;
    this.props.cancelledAt = DateService.now();
    this.props.cancelledBy = cancelledBy;
    this.props.cancellationReason = reason;
    this.props.updatedAt = DateService.now();

    this.addDomainEvent(
      new AppointmentCancelledEvent(
        this.props.id,
        this.props.cancelledAt,
        cancelledBy,
        reason,
        this.version
      )
    );
  }

  public complete(notes?: string): void {
    if (!this.canBeCompleted()) {
      throw new Error('Appointment cannot be completed in current state');
    }

    this.props.status = AppointmentStatus.COMPLETED;
    this.props.completedAt = DateService.now();
    this.props.updatedAt = DateService.now();
    
    if (notes) {
      this.props.notes = notes;
    }

    this.addDomainEvent(
      new AppointmentCompletedEvent(
        this.props.id,
        this.props.completedAt,
        notes,
        this.version
      )
    );
  }

  // For persistence mapping
  public toSnapshot(): AppointmentProps {
    return { ...this.props };
  }
}