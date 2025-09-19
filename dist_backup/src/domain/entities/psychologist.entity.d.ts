import { WorkingHours } from '../value-objects/working-hours.vo';
export declare class Psychologist {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly workingHours: WorkingHours;
    readonly phone?: string | undefined;
    readonly registrationId?: string | undefined;
    readonly biography?: string | undefined;
    readonly consultationFeeMin?: number | undefined;
    readonly consultationFeeMax?: number | undefined;
    readonly yearsExperience?: number | undefined;
    readonly profileImageUrl?: string | undefined;
    readonly timeSlotDuration: number;
    readonly isActive: boolean;
    readonly isVerified: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly createdBy?: string | undefined;
    readonly lastLoginAt?: Date | undefined;
    constructor(id: string, email: string, name: string, workingHours: WorkingHours, phone?: string | undefined, registrationId?: string | undefined, biography?: string | undefined, consultationFeeMin?: number | undefined, consultationFeeMax?: number | undefined, yearsExperience?: number | undefined, profileImageUrl?: string | undefined, timeSlotDuration?: number, isActive?: boolean, isVerified?: boolean, createdAt?: Date, updatedAt?: Date, createdBy?: string | undefined, lastLoginAt?: Date | undefined);
    private validate;
    private isValidEmail;
    isAvailableAt(dateTime: Date): boolean;
    updateWorkingHours(workingHours: WorkingHours): Psychologist;
    deactivate(): Psychologist;
    verify(): Psychologist;
    updateProfile(name?: string, phone?: string, biography?: string, profileImageUrl?: string): Psychologist;
}
