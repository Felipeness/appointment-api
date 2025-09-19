import { z } from 'zod';
import { AggregateRoot } from '../base/aggregate-root.base';
import { PatientId } from '../value-objects/patient-id.vo';
import { Email } from '../value-objects/email.vo';
import { Gender } from '../entities/enums';
declare const PatientPropsSchema: z.ZodObject<{
    id: z.ZodAny;
    email: z.ZodAny;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodDate>;
    gender: z.ZodOptional<z.ZodEnum<typeof Gender>>;
    address: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    emergencyPhone: z.ZodOptional<z.ZodString>;
    medicalNotes: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
    lastActiveAt: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export type PatientProps = z.infer<typeof PatientPropsSchema>;
export declare class Patient extends AggregateRoot<PatientProps> {
    private constructor();
    static create(props: Omit<PatientProps, 'id' | 'createdAt' | 'updatedAt'>): Patient;
    static reconstitute(props: PatientProps, version: number): Patient;
    get patientId(): PatientId;
    get email(): Email;
    get name(): string;
    get isActive(): boolean;
    deactivate(): void;
    activate(): void;
    updateContactInfo(email?: Email, phone?: string, address?: string): void;
    updateMedicalInfo(dateOfBirth?: Date, gender?: Gender, emergencyContact?: string, emergencyPhone?: string, medicalNotes?: string): void;
    calculateAge(): number | null;
    toSnapshot(): PatientProps;
}
export {};
