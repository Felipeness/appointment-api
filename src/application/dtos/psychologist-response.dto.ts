import { ApiProperty } from '@nestjs/swagger';

export class PsychologistResponseDto {
  @ApiProperty({
    description: 'Psychologist ID',
    example: 'clx123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Psychologist email address',
    example: 'psychologist@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Psychologist name',
    example: 'Dr. Jane Smith',
  })
  name: string;

  @ApiProperty({
    description: 'Working hours in JSON format',
    example: '{"monday": [{"start": "09:00", "end": "17:00"}], "tuesday": [{"start": "09:00", "end": "17:00"}]}',
  })
  workingHours: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+55 11 99999-9999',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Professional registration ID (CRP/CRM)',
    example: 'CRP 12345',
    required: false,
  })
  registrationId?: string;

  @ApiProperty({
    description: 'Professional biography',
    example: 'Specialized in cognitive behavioral therapy with 10 years of experience',
    required: false,
  })
  biography?: string;

  @ApiProperty({
    description: 'Minimum consultation fee',
    example: 100.00,
    required: false,
  })
  consultationFeeMin?: number;

  @ApiProperty({
    description: 'Maximum consultation fee',
    example: 200.00,
    required: false,
  })
  consultationFeeMax?: number;

  @ApiProperty({
    description: 'Years of experience',
    example: 10,
    required: false,
  })
  yearsExperience?: number;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Time slot duration in minutes',
    example: 60,
  })
  timeSlotDuration: number;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Verification status',
    example: false,
  })
  isVerified: boolean;

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
    description: 'Created by user ID',
    example: 'clx987654321',
    required: false,
  })
  createdBy?: string;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-12-20T10:00:00Z',
    required: false,
  })
  lastLoginAt?: string;
}