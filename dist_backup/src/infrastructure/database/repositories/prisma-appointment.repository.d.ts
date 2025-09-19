import { AppointmentRepository, ListAppointmentsFilters, PaginationOptions, PaginatedResult } from '../../../domain/repositories/appointment.repository';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../../domain/entities/enums';
import { PrismaService } from '../prisma.service';
export declare class PrismaAppointmentRepository implements AppointmentRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Appointment | null>;
    findByPsychologistAndDate(psychologistId: string, scheduledAt: Date): Promise<Appointment | null>;
    findByPatientId(patientId: string): Promise<Appointment[]>;
    findByPsychologistId(psychologistId: string): Promise<Appointment[]>;
    findByStatus(status: AppointmentStatus): Promise<Appointment[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
    findManyWithPagination(filters?: ListAppointmentsFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Appointment>>;
    save(appointment: Appointment): Promise<Appointment>;
    update(appointment: Appointment): Promise<Appointment>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
