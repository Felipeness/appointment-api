import { Gender } from '../../domain/entities/enums';
export declare class PatientResponseDto {
    id: string;
    email: string;
    name: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: Gender;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    medicalNotes?: string;
    preferredLanguage?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastActiveAt?: string;
}
