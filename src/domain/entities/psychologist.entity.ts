import type { WorkingHours } from '../value-objects/working-hours.vo';

export class Psychologist {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly workingHours: WorkingHours,
    public readonly phone?: string,
    public readonly registrationId?: string,
    public readonly biography?: string,
    public readonly consultationFeeMin?: number,
    public readonly consultationFeeMax?: number,
    public readonly yearsExperience?: number,
    public readonly profileImageUrl?: string,
    public readonly timeSlotDuration: number = 60,
    public readonly isActive: boolean = true,
    public readonly isVerified: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly createdBy?: string,
    public readonly lastLoginAt?: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Psychologist ID is required');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Valid email is required');
    }

    if (!this.name || this.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public isAvailableAt(dateTime: Date): boolean {
    if (!this.isActive) {
      return false;
    }

    return this.workingHours.isAvailableAt(dateTime);
  }

  public updateWorkingHours(workingHours: WorkingHours): Psychologist {
    return new Psychologist(
      this.id,
      this.email,
      this.name,
      workingHours,
      this.phone,
      this.registrationId,
      this.biography,
      this.consultationFeeMin,
      this.consultationFeeMax,
      this.yearsExperience,
      this.profileImageUrl,
      this.timeSlotDuration,
      this.isActive,
      this.isVerified,
      this.createdAt,
      new Date(),
      this.createdBy,
      this.lastLoginAt,
    );
  }

  public deactivate(): Psychologist {
    return new Psychologist(
      this.id,
      this.email,
      this.name,
      this.workingHours,
      this.phone,
      this.registrationId,
      this.biography,
      this.consultationFeeMin,
      this.consultationFeeMax,
      this.yearsExperience,
      this.profileImageUrl,
      this.timeSlotDuration,
      false,
      this.isVerified,
      this.createdAt,
      new Date(),
      this.createdBy,
      this.lastLoginAt,
    );
  }

  public verify(): Psychologist {
    return new Psychologist(
      this.id,
      this.email,
      this.name,
      this.workingHours,
      this.phone,
      this.registrationId,
      this.biography,
      this.consultationFeeMin,
      this.consultationFeeMax,
      this.yearsExperience,
      this.profileImageUrl,
      this.timeSlotDuration,
      this.isActive,
      true,
      this.createdAt,
      new Date(),
      this.createdBy,
      this.lastLoginAt,
    );
  }

  public updateProfile(
    name?: string,
    phone?: string,
    biography?: string,
    profileImageUrl?: string,
  ): Psychologist {
    return new Psychologist(
      this.id,
      this.email,
      name ?? this.name,
      this.workingHours,
      phone ?? this.phone,
      this.registrationId,
      biography ?? this.biography,
      this.consultationFeeMin,
      this.consultationFeeMax,
      this.yearsExperience,
      profileImageUrl ?? this.profileImageUrl,
      this.timeSlotDuration,
      this.isActive,
      this.isVerified,
      this.createdAt,
      new Date(),
      this.createdBy,
      new Date(), // lastLoginAt
    );
  }
}
