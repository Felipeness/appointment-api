import type { Gender } from './enums';

export class Patient {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly phone?: string,
    public readonly dateOfBirth?: Date,
    public readonly gender?: Gender,
    public readonly address?: string,
    public readonly emergencyContact?: string,
    public readonly emergencyPhone?: string,
    public readonly medicalNotes?: string,
    public readonly preferredLanguage?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly lastActiveAt?: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Patient ID is required');
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

  public deactivate(): Patient {
    return new Patient(
      this.id,
      this.email,
      this.name,
      this.phone,
      this.dateOfBirth,
      this.gender,
      this.address,
      this.emergencyContact,
      this.emergencyPhone,
      this.medicalNotes,
      this.preferredLanguage,
      false,
      this.createdAt,
      new Date(),
      this.lastActiveAt,
    );
  }

  public updateContactInfo(
    email?: string,
    phone?: string,
    address?: string,
  ): Patient {
    return new Patient(
      this.id,
      email ?? this.email,
      this.name,
      phone ?? this.phone,
      this.dateOfBirth,
      this.gender,
      address ?? this.address,
      this.emergencyContact,
      this.emergencyPhone,
      this.medicalNotes,
      this.preferredLanguage,
      this.isActive,
      this.createdAt,
      new Date(),
      new Date(), // lastActiveAt
    );
  }

  public updateMedicalInfo(
    dateOfBirth?: Date,
    gender?: Gender,
    emergencyContact?: string,
    emergencyPhone?: string,
    medicalNotes?: string,
  ): Patient {
    return new Patient(
      this.id,
      this.email,
      this.name,
      this.phone,
      dateOfBirth ?? this.dateOfBirth,
      gender ?? this.gender,
      this.address,
      emergencyContact ?? this.emergencyContact,
      emergencyPhone ?? this.emergencyPhone,
      medicalNotes ?? this.medicalNotes,
      this.preferredLanguage,
      this.isActive,
      this.createdAt,
      new Date(),
      new Date(), // lastActiveAt
    );
  }
}
