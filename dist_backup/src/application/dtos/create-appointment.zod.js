"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentValidationPipe = exports.CreateAppointmentSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../domain/entities/enums");
const sanitizeString = (str) => str.trim().replace(/[<>]/g, '');
const sanitizeEmail = (email) => email.toLowerCase().trim();
const sanitizePhone = (phone) => phone.replace(/[^\d+\-()\s]/g, '').trim();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[+]?[\d\s\-()]{8,20}$/;
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
exports.CreateAppointmentSchema = zod_1.z
    .object({
    patientEmail: zod_1.z
        .string({ message: 'Patient email is required' })
        .min(1, 'Patient email cannot be empty')
        .max(255, 'Email too long')
        .transform(sanitizeEmail)
        .refine((email) => emailRegex.test(email), {
        message: 'Invalid email format',
    }),
    patientName: zod_1.z
        .string({ message: 'Patient name is required' })
        .min(1, 'Patient name cannot be empty')
        .max(150, 'Patient name too long')
        .transform(sanitizeString)
        .refine((name) => name.length >= 2, {
        message: 'Patient name must be at least 2 characters',
    })
        .refine((name) => !/^\s*$/.test(name), {
        message: 'Patient name cannot be only whitespace',
    })
        .refine((name) => /^[a-zA-ZÀ-ÿ\u00C0-\u017F\s\-.']+$/.test(name), {
        message: 'Patient name contains invalid characters',
    }),
    patientPhone: zod_1.z
        .string()
        .optional()
        .transform((phone) => (phone ? sanitizePhone(phone) : phone))
        .refine((phone) => !phone || phoneRegex.test(phone), {
        message: 'Invalid phone number format',
    }),
    psychologistId: zod_1.z
        .string({ message: 'Psychologist ID is required' })
        .min(1, 'Psychologist ID cannot be empty'),
    scheduledAt: zod_1.z
        .string({ message: 'Scheduled date is required' })
        .datetime({ message: 'Invalid datetime format. Use ISO 8601 format.' })
        .transform((dateStr) => new Date(dateStr))
        .refine((date) => date > new Date(), {
        message: 'Appointment must be scheduled in the future',
    })
        .refine((date) => {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        return date <= maxDate;
    }, {
        message: 'Appointment cannot be scheduled more than 1 year in advance',
    }),
    duration: zod_1.z
        .number()
        .int('Duration must be an integer')
        .min(15, 'Duration must be at least 15 minutes')
        .max(480, 'Duration cannot exceed 8 hours')
        .default(60)
        .optional(),
    appointmentType: zod_1.z
        .nativeEnum(enums_1.AppointmentType, {
        message: 'Invalid appointment type',
    })
        .default(enums_1.AppointmentType.CONSULTATION)
        .optional(),
    meetingType: zod_1.z
        .nativeEnum(enums_1.MeetingType, {
        message: 'Invalid meeting type',
    })
        .default(enums_1.MeetingType.IN_PERSON)
        .optional(),
    meetingUrl: zod_1.z
        .string()
        .optional()
        .refine((url) => !url || urlRegex.test(url), {
        message: 'Invalid meeting URL format',
    }),
    meetingRoom: zod_1.z
        .string()
        .max(100, 'Meeting room name too long')
        .transform((room) => (room ? sanitizeString(room) : room))
        .optional(),
    reason: zod_1.z
        .string()
        .max(500, 'Reason too long')
        .transform((reason) => (reason ? sanitizeString(reason) : reason))
        .optional(),
    notes: zod_1.z
        .string()
        .max(1000, 'Notes too long')
        .transform((notes) => (notes ? sanitizeString(notes) : notes))
        .optional(),
    consultationFee: zod_1.z
        .number()
        .min(0, 'Consultation fee cannot be negative')
        .max(10000, 'Consultation fee too high')
        .optional(),
})
    .refine((data) => {
    if (data.meetingType === enums_1.MeetingType.VIDEO_CALL ||
        data.meetingType === enums_1.MeetingType.PHONE_CALL) {
        return data.meetingUrl && data.meetingUrl.length > 0;
    }
    return true;
}, {
    message: 'Meeting URL is required for video/phone call appointments',
    path: ['meetingUrl'],
})
    .refine((data) => {
    if (data.meetingType === enums_1.MeetingType.IN_PERSON) {
        return data.meetingRoom && data.meetingRoom.length > 0;
    }
    return true;
}, {
    message: 'Meeting room is required for in-person appointments',
    path: ['meetingRoom'],
});
const createAppointmentValidationPipe = () => new (class {
    transform(value) {
        try {
            return exports.CreateAppointmentSchema.parse(value);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessage = error.issues
                    .map((err) => `${err.path.join('.')}: ${err.message}`)
                    .join(', ');
                throw new Error(`Validation failed: ${errorMessage}`);
            }
            throw error;
        }
    }
})();
exports.createAppointmentValidationPipe = createAppointmentValidationPipe;
//# sourceMappingURL=create-appointment.zod.js.map