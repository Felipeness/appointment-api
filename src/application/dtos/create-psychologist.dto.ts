import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePsychologistDto {
  @ApiProperty({
    description: 'Psychologist email address',
    example: 'psychologist@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Psychologist name',
    example: 'Dr. Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Working hours in JSON format',
    example:
      '{"monday": [{"start": "09:00", "end": "17:00"}], "tuesday": [{"start": "09:00", "end": "17:00"}]}',
  })
  @IsString()
  @IsNotEmpty()
  workingHours: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Professional registration ID (CRP/CRM)',
    example: 'CRP 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  registrationId?: string;

  @ApiProperty({
    description: 'Professional biography',
    example:
      'Specialized in cognitive behavioral therapy with 10 years of experience',
    required: false,
  })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({
    description: 'Minimum consultation fee',
    example: 100.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFeeMin?: number;

  @ApiProperty({
    description: 'Maximum consultation fee',
    example: 200.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFeeMax?: number;

  @ApiProperty({
    description: 'Years of experience',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(70)
  yearsExperience?: number;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Time slot duration in minutes',
    example: 60,
    default: 60,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(180)
  timeSlotDuration?: number;
}
