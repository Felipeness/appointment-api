import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../entities/enums';

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByPsychologistAndDate(
    psychologistId: string,
    scheduledAt: Date,
  ): Promise<Appointment | null>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByPsychologistId(psychologistId: string): Promise<Appointment[]>;
  findByStatus(status: AppointmentStatus): Promise<Appointment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
  delete(id: string): Promise<void>;
}
