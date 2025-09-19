import { Gender } from './enums';
export declare class Patient {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly phone?: string | undefined;
    readonly dateOfBirth?: Date | undefined;
    readonly gender?: Gender | undefined;
    readonly address?: string | undefined;
    readonly emergencyContact?: string | undefined;
    readonly emergencyPhone?: string | undefined;
    readonly medicalNotes?: string | undefined;
    readonly preferredLanguage?: string | undefined;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly lastActiveAt?: Date | undefined;
    constructor(id: string, email: string, name: string, phone?: string | undefined, dateOfBirth?: Date | undefined, gender?: Gender | undefined, address?: string | undefined, emergencyContact?: string | undefined, emergencyPhone?: string | undefined, medicalNotes?: string | undefined, preferredLanguage?: string | undefined, isActive?: boolean, createdAt?: Date, updatedAt?: Date, lastActiveAt?: Date | undefined);
    private validate;
    private isValidEmail;
    deactivate(): Patient;
    updateContactInfo(email?: string, phone?: string, address?: string): Patient;
    updateMedicalInfo(dateOfBirth?: Date, gender?: Gender, emergencyContact?: string, emergencyPhone?: string, medicalNotes?: string): Patient;
}
