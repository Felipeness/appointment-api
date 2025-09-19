import { AppointmentStatus, AppointmentType, MeetingType } from '../../domain/entities/enums';
export declare class AppointmentResponseDto {
    id: string;
    patientId: string;
    psychologistId: string;
    scheduledAt: string;
    duration: number;
    appointmentType: AppointmentType;
    status: AppointmentStatus;
    meetingType: MeetingType;
    meetingUrl?: string;
    meetingRoom?: string;
    reason?: string;
    notes?: string;
    privateNotes?: string;
    consultationFee?: number;
    isPaid: boolean;
    cancelledAt?: string;
    cancelledBy?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt: string;
    confirmedAt?: string;
    completedAt?: string;
}
