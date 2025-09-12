import { ApiProperty } from '@nestjs/swagger';
import {
  AppointmentStatus,
  AppointmentType,
  MeetingType,
} from '../../domain/entities/enums';

export class AppointmentResponseDto {
  @ApiProperty({
    description: 'Appointment ID',
    example: 'clx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Patient ID',
    example: 'clx987654321',
  })
  patientId: string;

  @ApiProperty({
    description: 'Psychologist ID',
    example: 'clx111222333',
  })
  psychologistId: string;

  @ApiProperty({
    description: 'Scheduled date and time',
    example: '2024-12-25T10:00:00Z',
  })
  scheduledAt: string;

  @ApiProperty({
    description: 'Appointment duration in minutes',
    example: 60,
  })
  duration: number;

  @ApiProperty({
    description: 'Type of appointment',
    enum: AppointmentType,
    example: AppointmentType.CONSULTATION,
  })
  appointmentType: AppointmentType;

  @ApiProperty({
    description: 'Appointment status',
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @ApiProperty({
    description: 'Meeting type',
    enum: MeetingType,
    example: MeetingType.IN_PERSON,
  })
  meetingType: MeetingType;

  @ApiProperty({
    description: 'Meeting URL for video/phone calls',
    example: 'https://meet.google.com/xyz-abc-def',
    required: false,
  })
  meetingUrl?: string;

  @ApiProperty({
    description: 'Meeting room for in-person appointments',
    example: 'Room 301',
    required: false,
  })
  meetingRoom?: string;

  @ApiProperty({
    description: 'Reason for appointment',
    example: 'Anxiety treatment consultation',
    required: false,
  })
  reason?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'First consultation',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Private notes (psychologist only)',
    example: 'Patient shows signs of improvement',
    required: false,
  })
  privateNotes?: string;

  @ApiProperty({
    description: 'Consultation fee',
    example: 150.0,
    required: false,
  })
  consultationFee?: number;

  @ApiProperty({
    description: 'Payment status',
    example: false,
  })
  isPaid: boolean;

  @ApiProperty({
    description: 'Cancelled timestamp',
    example: '2024-12-20T10:00:00Z',
    required: false,
  })
  cancelledAt?: string;

  @ApiProperty({
    description: 'Who cancelled the appointment',
    example: 'patient',
    required: false,
  })
  cancelledBy?: string;

  @ApiProperty({
    description: 'Cancellation reason',
    example: 'Personal emergency',
    required: false,
  })
  cancellationReason?: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-12-20T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-12-20T10:00:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Confirmed timestamp',
    example: '2024-12-20T10:00:00Z',
    required: false,
  })
  confirmedAt?: string;

  @ApiProperty({
    description: 'Completed timestamp',
    example: '2024-12-20T10:00:00Z',
    required: false,
  })
  completedAt?: string;
}
