import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../domain/entities/enums';

export class PatientResponseDto {
  @ApiProperty({
    description: 'Patient ID',
    example: 'clx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Patient email address',
    example: 'patient@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Patient name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+55 11 99999-9999',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-05-15',
    required: false,
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.PREFER_NOT_TO_SAY,
    required: false,
  })
  gender?: Gender;

  @ApiProperty({
    description: 'Patient address',
    example: '123 Main St, City, State, ZIP',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
    required: false,
  })
  emergencyContact?: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+55 11 88888-8888',
    required: false,
  })
  emergencyPhone?: string;

  @ApiProperty({
    description: 'Medical notes and history',
    example: 'No known allergies',
    required: false,
  })
  medicalNotes?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'Portuguese',
    required: false,
  })
  preferredLanguage?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

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
    description: 'Last active timestamp',
    example: '2024-12-20T10:00:00Z',
    required: false,
  })
  lastActiveAt?: string;
}