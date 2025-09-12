import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../domain/entities/enums';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Patient email address',
    example: 'patient@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Patient name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1990-05-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.PREFER_NOT_TO_SAY,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Patient address',
    example: '123 Main St, City, State, ZIP',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+55 11 88888-8888',
    required: false,
  })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiProperty({
    description: 'Medical notes and history',
    example: 'No known allergies',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'Portuguese',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
