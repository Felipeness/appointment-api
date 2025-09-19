import { BaseDomainEvent } from '../base/domain-event.base';
import { AppointmentId } from '../value-objects/appointment-id.vo';
import { PatientId } from '../value-objects/patient-id.vo';
import { PsychologistId } from '../value-objects/psychologist-id.vo';
export declare class AppointmentScheduledEvent extends BaseDomainEvent {
    readonly patientId: PatientId;
    readonly psychologistId: PsychologistId;
    readonly scheduledAt: Date;
    readonly duration: number;
    constructor(appointmentId: AppointmentId, patientId: PatientId, psychologistId: PsychologistId, scheduledAt: Date, duration: number, version?: number);
}
export declare class AppointmentConfirmedEvent extends BaseDomainEvent {
    readonly confirmedAt: Date;
    readonly notes?: string;
    constructor(appointmentId: AppointmentId, confirmedAt: Date, notes?: string, version?: number);
}
export declare class AppointmentCancelledEvent extends BaseDomainEvent {
    readonly cancelledAt: Date;
    readonly cancelledBy: string;
    readonly reason?: string;
    constructor(appointmentId: AppointmentId, cancelledAt: Date, cancelledBy: string, reason?: string, version?: number);
}
export declare class AppointmentCompletedEvent extends BaseDomainEvent {
    readonly completedAt: Date;
    readonly notes?: string;
    constructor(appointmentId: AppointmentId, completedAt: Date, notes?: string, version?: number);
}
export declare class AppointmentDeclinedEvent extends BaseDomainEvent {
    readonly declinedAt: Date;
    readonly notes?: string;
    constructor(appointmentId: AppointmentId, declinedAt: Date, notes?: string, version?: number);
}
