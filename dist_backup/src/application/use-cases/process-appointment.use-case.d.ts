import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
import type { PatientRepository } from '../../domain/repositories/patient.repository';
import type { PsychologistRepository } from '../../domain/repositories/psychologist.repository';
import { OutboxService } from '../../infrastructure/database/outbox/outbox.service';
export interface AppointmentMessage {
    appointmentId: string;
    patientEmail: string;
    patientName: string;
    patientPhone?: string;
    psychologistId: string;
    scheduledAt: string;
    duration?: number;
    appointmentType?: string;
    meetingType?: string;
    meetingUrl?: string;
    meetingRoom?: string;
    reason?: string;
    notes?: string;
    consultationFee?: number;
}
export declare class ProcessAppointmentUseCase {
    private readonly appointmentRepository;
    private readonly patientRepository;
    private readonly psychologistRepository;
    private readonly outboxService;
    private readonly logger;
    constructor(appointmentRepository: AppointmentRepository, patientRepository: PatientRepository, psychologistRepository: PsychologistRepository, outboxService: OutboxService);
    execute(message: AppointmentMessage): Promise<void>;
    private declineAppointment;
    private sendNotification;
}
