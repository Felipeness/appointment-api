import type { Appointment } from '../../domain/aggregates/appointment.aggregate';
import type { AppointmentId } from '../../domain/value-objects/appointment-id.vo';
import type { PatientId } from '../../domain/value-objects/patient-id.vo';
import type { PsychologistId } from '../../domain/value-objects/psychologist-id.vo';
import type { AppointmentStatus } from '../../domain/entities/enums';

export interface AppointmentRepositoryPort {
  save(appointment: Appointment): Promise<void>;
  findById(id: AppointmentId): Promise<Appointment | null>;
  findByPatientId(patientId: PatientId): Promise<Appointment[]>;
  findByPsychologistId(psychologistId: PsychologistId): Promise<Appointment[]>;
  findByStatus(status: AppointmentStatus): Promise<Appointment[]>;
  findConflictingAppointments(
    psychologistId: PsychologistId,
    scheduledAt: Date,
    duration: number,
    excludeAppointmentId?: AppointmentId,
  ): Promise<Appointment[]>;
  findUpcomingAppointments(limit?: number): Promise<Appointment[]>;
  delete(id: AppointmentId): Promise<void>;
}
