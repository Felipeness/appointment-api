import type { Appointment } from '../entities/appointment.entity';
import type { AppointmentStatus, AppointmentType } from '../entities/enums';

export interface ListAppointmentsFilters {
  patientId?: string;
  psychologistId?: string;
  status?: AppointmentStatus;
  appointmentType?: AppointmentType;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
  findManyWithPagination(
    filters?: ListAppointmentsFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Appointment>>;
  save(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
  delete(id: string): Promise<void>;
}
