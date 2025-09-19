export declare class PsychologistResponseDto {
    id: string;
    email: string;
    name: string;
    workingHours: string;
    phone?: string;
    registrationId?: string;
    biography?: string;
    consultationFeeMin?: number;
    consultationFeeMax?: number;
    yearsExperience?: number;
    profileImageUrl?: string;
    timeSlotDuration: number;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    lastLoginAt?: string;
}
