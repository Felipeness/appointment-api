import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsUrl,
  ValidateIf,
  Matches,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType, MeetingType } from '../../domain/entities/enums';
import {
  CreateAppointmentSchema,
  CreateAppointmentInput,
} from './create-appointment.zod';

export class CreateAppointmentDto {
  /**
   * Validate the DTO using Zod schema
   */
  static validateWithZod(data: unknown): CreateAppointmentInput {
    return CreateAppointmentSchema.parse(data);
  }

  /**
   * Create a DTO instance with comprehensive validation
   */
  static create(data: unknown): CreateAppointmentDto {
    // First validate with Zod
    const validatedData = CreateAppointmentDto.validateWithZod(data);

    // Then create the DTO instance
    const dto = new CreateAppointmentDto();
    Object.assign(dto, validatedData);
    return dto;
  }

  @ApiProperty({
    description: 'Patient email address',
    example: 'patient@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(1, 255, { message: 'Email must be between 1 and 255 characters' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  patientEmail: string;

  @ApiProperty({
    description: 'Patient name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Patient name is required' })
  @Length(2, 150, {
    message: 'Patient name must be between 2 and 150 characters',
  })
  @Matches(/^[a-zA-ZÀ-ÿ\u00C0-\u017F\s\-.']+$/, {
    message: 'Patient name contains invalid characters',
  })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : value,
  )
  patientName: string;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[+]?[\d\s\-()]{8,20}$/, {
    message: 'Invalid phone number format',
  })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string'
      ? value.replace(/[^\d+\-()\s]/g, '').trim()
      : value,
  )
  patientPhone?: string;

  @ApiProperty({
    description: 'Psychologist ID',
    example: 'clx123456789',
  })
  @IsString()
  @IsNotEmpty()
  psychologistId: string;

  @ApiProperty({
    description: 'Appointment scheduled date and time (ISO 8601)',
    example: '2024-12-25T10:00:00Z',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({
    description: 'Appointment duration in minutes',
    example: 60,
    default: 60,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  duration?: number;

  @ApiProperty({
    description: 'Type of appointment',
    enum: AppointmentType,
    example: AppointmentType.CONSULTATION,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @ApiProperty({
    description: 'Meeting type',
    enum: MeetingType,
    example: MeetingType.IN_PERSON,
    required: false,
  })
  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @ApiProperty({
    description: 'Meeting URL for video/phone calls',
    example: 'https://meet.google.com/xyz-abc-def',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @ValidateIf(
    (o: CreateAppointmentDto) =>
      o.meetingType === MeetingType.VIDEO_CALL ||
      o.meetingType === MeetingType.PHONE_CALL,
  )
  meetingUrl?: string;

  @ApiProperty({
    description: 'Meeting room for in-person appointments',
    example: 'Room 301',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf(
    (o: CreateAppointmentDto) => o.meetingType === MeetingType.IN_PERSON,
  )
  meetingRoom?: string;

  @ApiProperty({
    description: 'Reason for appointment',
    example: 'Anxiety treatment consultation',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'First consultation',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Consultation fee for this appointment',
    example: 150.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;
}
