import { z } from 'zod';
import { AppointmentType, MeetingType } from '../../domain/entities/enums';
export declare const CreateAppointmentSchema: z.ZodObject<{
    patientEmail: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    patientName: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    patientPhone: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    psychologistId: z.ZodString;
    scheduledAt: z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>;
    duration: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    appointmentType: z.ZodOptional<z.ZodDefault<z.ZodEnum<typeof AppointmentType>>>;
    meetingType: z.ZodOptional<z.ZodDefault<z.ZodEnum<typeof MeetingType>>>;
    meetingUrl: z.ZodOptional<z.ZodString>;
    meetingRoom: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    reason: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    notes: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
    consultationFee: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export declare const createAppointmentValidationPipe: () => {
    transform(value: unknown): {
        patientEmail: string;
        patientName: string;
        patientPhone: string | undefined;
        psychologistId: string;
        scheduledAt: Date;
        duration?: number | undefined;
        appointmentType?: AppointmentType | undefined;
        meetingType?: MeetingType | undefined;
        meetingUrl?: string | undefined;
        meetingRoom?: string | undefined;
        reason?: string | undefined;
        notes?: string | undefined;
        consultationFee?: number | undefined;
    };
};
