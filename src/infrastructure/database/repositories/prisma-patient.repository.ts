import { Injectable } from '@nestjs/common';
import { PatientRepository } from '../../../domain/repositories/patient.repository';
import { Patient } from '../../../domain/entities/patient.entity';
import { Gender } from '../../../domain/entities/enums';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Patient | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    return patient ? this.toDomain(patient) : null;
  }

  async findByEmail(email: string): Promise<Patient | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { email },
    });

    return patient ? this.toDomain(patient) : null;
  }

  async findAll(): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany();
    return patients.map(this.toDomain);
  }

  async save(patient: Patient): Promise<Patient> {
    const data = this.toPersistence(patient);
    const saved = await this.prisma.patient.create({ data });
    return this.toDomain(saved);
  }

  async update(patient: Patient): Promise<Patient> {
    const data = this.toPersistence(patient);
    const updated = await this.prisma.patient.update({
      where: { id: patient.id },
      data,
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.patient.delete({
      where: { id },
    });
  }

  private toDomain(patient: any): Patient {
    return new Patient(
      patient.id,
      patient.email,
      patient.name,
      patient.phone,
      patient.dateOfBirth,
      patient.gender as Gender,
      patient.address,
      patient.emergencyContact,
      patient.emergencyPhone,
      patient.medicalNotes,
      patient.preferredLanguage,
      patient.isActive,
      patient.createdAt,
      patient.updatedAt,
      patient.lastActiveAt,
    );
  }

  private toPersistence(patient: Patient): any {
    return {
      id: patient.id,
      email: patient.email,
      name: patient.name,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      medicalNotes: patient.medicalNotes,
      preferredLanguage: patient.preferredLanguage,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      lastActiveAt: patient.lastActiveAt,
    };
  }
}
