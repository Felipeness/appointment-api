import { z } from 'zod';
import { AggregateRoot } from '../base/aggregate-root.base';
import { PatientId } from '../value-objects/patient-id.vo';
import { Email } from '../value-objects/email.vo';
import { DateService } from '../services/date.service';
import { Gender } from '../entities/enums';

const PatientPropsSchema = z.object({
  id: z.any(), // Temporarily any for compatibility
  email: z.any(), // Temporarily any for compatibility
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional(),
  dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in the future').optional(),
  gender: z.nativeEnum(Gender).optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  emergencyContact: z.string().max(100, 'Emergency contact name is too long').optional(),
  emergencyPhone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid emergency phone format').optional(),
  medicalNotes: z.string().max(1000, 'Medical notes are too long').optional(),
  preferredLanguage: z.string().max(50, 'Preferred language is too long').optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastActiveAt: z.date().optional(),
});

export type PatientProps = z.infer<typeof PatientPropsSchema>;

export class Patient extends AggregateRoot<PatientProps> {
  private constructor(props: PatientProps, version?: number) {
    super(props, props.id.toString(), version);
  }

  public static create(props: Omit<PatientProps, 'id' | 'createdAt' | 'updatedAt'>): Patient {
    const patientProps: PatientProps = {
      ...props,
      id: PatientId.create(),
      createdAt: DateService.now(),
      updatedAt: DateService.now(),
    };

    const validatedProps = PatientPropsSchema.parse(patientProps);
    return new Patient(validatedProps);
  }

  public static reconstitute(props: PatientProps, version: number): Patient {
    return new Patient(props, version);
  }

  // Getters
  public get patientId(): PatientId {
    return this.props.id;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get name(): string {
    return this.props.name;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  // Business methods
  public deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('Patient is already inactive');
    }

    this.props.isActive = false;
    this.props.updatedAt = DateService.now();
  }

  public activate(): void {
    if (this.props.isActive) {
      throw new Error('Patient is already active');
    }

    this.props.isActive = true;
    this.props.updatedAt = DateService.now();
  }

  public updateContactInfo(email?: Email, phone?: string, address?: string): void {
    if (email) {
      this.props.email = email;
    }
    
    if (phone !== undefined) {
      if (phone && !PatientPropsSchema.shape.phone.safeParse(phone).success) {
        throw new Error('Invalid phone format');
      }
      this.props.phone = phone || undefined;
    }
    
    if (address !== undefined) {
      if (address && address.length > 500) {
        throw new Error('Address is too long');
      }
      this.props.address = address || undefined;
    }

    this.props.updatedAt = DateService.now();
    this.props.lastActiveAt = DateService.now();
  }

  public updateMedicalInfo(
    dateOfBirth?: Date,
    gender?: Gender,
    emergencyContact?: string,
    emergencyPhone?: string,
    medicalNotes?: string,
  ): void {
    if (dateOfBirth !== undefined) {
      if (dateOfBirth && dateOfBirth > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      this.props.dateOfBirth = dateOfBirth || undefined;
    }

    if (gender !== undefined) {
      this.props.gender = gender || undefined;
    }

    if (emergencyContact !== undefined) {
      if (emergencyContact && emergencyContact.length > 100) {
        throw new Error('Emergency contact name is too long');
      }
      this.props.emergencyContact = emergencyContact || undefined;
    }

    if (emergencyPhone !== undefined) {
      if (emergencyPhone && !PatientPropsSchema.shape.emergencyPhone.safeParse(emergencyPhone).success) {
        throw new Error('Invalid emergency phone format');
      }
      this.props.emergencyPhone = emergencyPhone || undefined;
    }

    if (medicalNotes !== undefined) {
      if (medicalNotes && medicalNotes.length > 1000) {
        throw new Error('Medical notes are too long');
      }
      this.props.medicalNotes = medicalNotes || undefined;
    }

    this.props.updatedAt = DateService.now();
    this.props.lastActiveAt = DateService.now();
  }

  public calculateAge(): number | null {
    if (!this.props.dateOfBirth) {
      return null;
    }

    const today = DateService.now();
    const birthDate = this.props.dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // For persistence mapping
  public toSnapshot(): PatientProps {
    return { ...this.props };
  }
}