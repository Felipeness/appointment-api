import { AppointmentType, MeetingType } from '../../domain/entities/enums';
import { CreateAppointmentInput } from './create-appointment.zod';
export declare class CreateAppointmentDto {
    static validateWithZod(data: unknown): CreateAppointmentInput;
    static create(data: unknown): CreateAppointmentDto;
    patientEmail: string;
    patientName: string;
    patientPhone?: string;
    psychologistId: string;
    scheduledAt: string;
    duration?: number;
    appointmentType?: AppointmentType;
    meetingType?: MeetingType;
    meetingUrl?: string;
    meetingRoom?: string;
    reason?: string;
    notes?: string;
    consultationFee?: number;
}
