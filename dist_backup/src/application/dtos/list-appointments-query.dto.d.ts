import { AppointmentStatus, AppointmentType } from '../../domain/entities/enums';
export declare class ListAppointmentsQueryDto {
    page?: number;
    limit?: number;
    patientId?: string;
    psychologistId?: string;
    status?: AppointmentStatus;
    appointmentType?: AppointmentType;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
