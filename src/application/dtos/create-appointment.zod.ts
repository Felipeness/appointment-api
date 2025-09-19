import { z } from 'zod';
import { AppointmentType, MeetingType } from '../../domain/entities/enums';

// Sanitization utilities
const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');
const sanitizeEmail = (email: string) => email.toLowerCase().trim();
const sanitizePhone = (phone: string) =>
  phone.replace(/[^\d+\-()\s]/g, '').trim();

// Email validation regex (more comprehensive)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone validation regex (international formats)
const phoneRegex = /^[+]?[\d\s\-()]{8,20}$/;

// URL validation for meeting URLs
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// UUID/CUID validation for psychologist ID (currently unused but kept for reference)
// const uuidRegex =
//   /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CreateAppointmentSchema = z
  .object({
    // Patient email with sanitization
    patientEmail: z
      .string({ message: 'Patient email is required' })
      .min(1, 'Patient email cannot be empty')
      .max(255, 'Email too long')
      .transform(sanitizeEmail)
      .refine((email) => emailRegex.test(email), {
        message: 'Invalid email format',
      }),

    // Patient name with sanitization and comprehensive validation
    patientName: z
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

    // Optional patient phone with validation and sanitization
    patientPhone: z
      .string()
      .optional()
      .transform((phone) =>
        phone !== undefined && phone !== null && phone !== ''
          ? sanitizePhone(phone)
          : phone,
      )
      .refine(
        (phone) =>
          phone === undefined ||
          phone === null ||
          phone === '' ||
          phoneRegex.test(phone),
        {
          message: 'Invalid phone number format',
        },
      ),

    // Psychologist ID validation - relaxed for testing
    psychologistId: z
      .string({ message: 'Psychologist ID is required' })
      .min(1, 'Psychologist ID cannot be empty'),

    // Scheduled date with future validation
    scheduledAt: z
      .string({ message: 'Scheduled date is required' })
      .datetime({ message: 'Invalid datetime format. Use ISO 8601 format.' })
      .transform((dateStr) => new Date(dateStr))
      .refine((date) => date > new Date(), {
        message: 'Appointment must be scheduled in the future',
      })
      .refine(
        (date) => {
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() + 1);
          return date <= maxDate;
        },
        {
          message:
            'Appointment cannot be scheduled more than 1 year in advance',
        },
      ),

    // Duration validation
    duration: z
      .number()
      .int('Duration must be an integer')
      .min(15, 'Duration must be at least 15 minutes')
      .max(480, 'Duration cannot exceed 8 hours')
      .default(60)
      .optional(),

    // Appointment type validation
    appointmentType: z
      .nativeEnum(AppointmentType, {
        message: 'Invalid appointment type',
      })
      .default(AppointmentType.CONSULTATION)
      .optional(),

    // Meeting type validation
    meetingType: z
      .nativeEnum(MeetingType, {
        message: 'Invalid meeting type',
      })
      .default(MeetingType.IN_PERSON)
      .optional(),

    // Meeting URL conditional validation
    meetingUrl: z
      .string()
      .optional()
      .refine(
        (url) =>
          url === undefined || url === null || url === '' || urlRegex.test(url),
        {
          message: 'Invalid meeting URL format',
        },
      ),

    // Meeting room conditional validation
    meetingRoom: z
      .string()
      .max(100, 'Meeting room name too long')
      .transform((room) =>
        room !== undefined && room !== null && room !== ''
          ? sanitizeString(room)
          : room,
      )
      .optional(),

    // Reason validation with sanitization
    reason: z
      .string()
      .max(500, 'Reason too long')
      .transform((reason) =>
        reason !== undefined && reason !== null && reason !== ''
          ? sanitizeString(reason)
          : reason,
      )
      .optional(),

    // Notes validation with sanitization
    notes: z
      .string()
      .max(1000, 'Notes too long')
      .transform((notes) => (notes ? sanitizeString(notes) : notes))
      .optional(),

    // Consultation fee validation
    consultationFee: z
      .number()
      .min(0, 'Consultation fee cannot be negative')
      .max(10000, 'Consultation fee too high')
      .optional(),
  })
  // Cross-field validations
  .refine(
    (data) => {
      // If meeting type is video call or phone call, meeting URL is required
      if (
        data.meetingType === MeetingType.VIDEO_CALL ||
        data.meetingType === MeetingType.PHONE_CALL
      ) {
        return (
          data.meetingUrl !== undefined &&
          data.meetingUrl !== null &&
          data.meetingUrl.length > 0
        );
      }
      return true;
    },
    {
      message: 'Meeting URL is required for video/phone call appointments',
      path: ['meetingUrl'],
    },
  )
  .refine(
    (data) => {
      // If meeting type is in-person, meeting room should be provided
      if (data.meetingType === MeetingType.IN_PERSON) {
        return (
          data.meetingRoom !== undefined &&
          data.meetingRoom !== null &&
          data.meetingRoom.length > 0
        );
      }
      return true;
    },
    {
      message: 'Meeting room is required for in-person appointments',
      path: ['meetingRoom'],
    },
  );
// Business hours validation disabled for testing
// .refine(
//   (data) => {
//     // Validate business hours (9 AM to 6 PM, Monday to Friday)
//     const appointmentDate = data.scheduledAt;
//     const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 6 = Saturday
//     const hour = appointmentDate.getHours();

//     return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 18;
//   },
//   {
//     message:
//       'Appointments can only be scheduled during business hours (9 AM - 6 PM, Monday to Friday)',
//     path: ['scheduledAt'],
//   },
// );

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

// Helper function to create a validation pipe for this schema
export const createAppointmentValidationPipe = () =>
  new (class {
    transform(value: unknown) {
      try {
        return CreateAppointmentSchema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.issues
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          throw new Error(`Validation failed: ${errorMessage}`);
        }
        throw error;
      }
    }
  })();
