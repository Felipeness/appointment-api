import { Injectable } from '@nestjs/common';
import { PatientRepositoryPort } from '../../../application/ports/patient.repository.port';
import { Patient, PatientProps } from '../../../domain/aggregates/patient.aggregate';
import { PatientId } from '../../../domain/value-objects/patient-id.vo';
import { Email } from '../../../domain/value-objects/email.vo';
import { PrismaService } from '../prisma.service';
import { Patient as PrismaPatient, Gender as PrismaGender } from '@prisma/client';
import { Gender } from '../../../domain/entities/enums';

@Injectable()
export class PrismaPatientRepositoryAdapter implements PatientRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(patient: Patient): Promise<void> {
    const snapshot = patient.toSnapshot();
    const prismaData = this.toPersistence(snapshot);

    await this.prisma.patient.upsert({
      where: { id: snapshot.id.toString() },
      create: prismaData,
      update: {
        ...prismaData,
        updatedAt: new Date(),
      },
    });

    // Mark domain events as committed
    patient.markEventsAsCommitted();
  }

  async findById(id: PatientId): Promise<Patient | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: id.toString() },
    });

    return patient ? this.toDomain(patient) : null;
  }

  async findByEmail(email: Email): Promise<Patient | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { email: email.toString() },
    });

    return patient ? this.toDomain(patient) : null;
  }

  async findActivePatients(limit = 50, offset = 0): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return patients.map(patient => this.toDomain(patient));
  }

  async findInactivePatients(limit = 50, offset = 0): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany({
      where: { isActive: false },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return patients.map(patient => this.toDomain(patient));
  }

  async existsById(id: PatientId): Promise<boolean> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: id.toString() },
      select: { id: true },
    });

    return !!patient;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const patient = await this.prisma.patient.findUnique({
      where: { email: email.toString() },
      select: { id: true },
    });

    return !!patient;
  }

  async delete(id: PatientId): Promise<void> {
    await this.prisma.patient.delete({
      where: { id: id.toString() },
    });
  }

  private toDomain(prismaPatient: PrismaPatient): Patient {
    const props: PatientProps = {
      id: PatientId.fromString(prismaPatient.id),
      email: Email.create(prismaPatient.email),
      name: prismaPatient.name,
      phone: prismaPatient.phone || undefined,
      dateOfBirth: prismaPatient.dateOfBirth || undefined,
      gender: prismaPatient.gender ? this.genderFromPrisma(prismaPatient.gender) : undefined,
      address: prismaPatient.address || undefined,
      emergencyContact: prismaPatient.emergencyContact || undefined,
      emergencyPhone: prismaPatient.emergencyPhone || undefined,
      medicalNotes: prismaPatient.medicalNotes || undefined,
      preferredLanguage: prismaPatient.preferredLanguage || undefined,
      isActive: prismaPatient.isActive,
      createdAt: prismaPatient.createdAt,
      updatedAt: prismaPatient.updatedAt,
      lastActiveAt: prismaPatient.lastActiveAt || undefined,
    };

    return Patient.reconstitute(props, 1); // Version would come from event store in full implementation
  }

  private toPersistence(props: PatientProps): Omit<PrismaPatient, 'id'> & { id: string } {
    return {
      id: props.id.toString(),
      email: props.email.toString(),
      name: props.name,
      phone: props.phone || null,
      dateOfBirth: props.dateOfBirth || null,
      gender: props.gender ? this.genderToPrisma(props.gender) : null,
      address: props.address || null,
      emergencyContact: props.emergencyContact || null,
      emergencyPhone: props.emergencyPhone || null,
      medicalNotes: props.medicalNotes || null,
      preferredLanguage: props.preferredLanguage || null,
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      lastActiveAt: props.lastActiveAt || null,
    };
  }

  private genderFromPrisma(gender: PrismaGender): Gender {
    const genderMap: Record<PrismaGender, Gender> = {
      MALE: Gender.MALE,
      FEMALE: Gender.FEMALE,
      NON_BINARY: Gender.NON_BINARY,
      PREFER_NOT_TO_SAY: Gender.PREFER_NOT_TO_SAY,
    };
    return genderMap[gender];
  }

  private genderToPrisma(gender: Gender): PrismaGender {
    const genderMap: Record<Gender, PrismaGender> = {
      [Gender.MALE]: PrismaGender.MALE,
      [Gender.FEMALE]: PrismaGender.FEMALE,
      [Gender.OTHER]: PrismaGender.NON_BINARY, // Map OTHER to NON_BINARY
      [Gender.NON_BINARY]: PrismaGender.NON_BINARY,
      [Gender.PREFER_NOT_TO_SAY]: PrismaGender.PREFER_NOT_TO_SAY,
    };
    return genderMap[gender];
  }
}