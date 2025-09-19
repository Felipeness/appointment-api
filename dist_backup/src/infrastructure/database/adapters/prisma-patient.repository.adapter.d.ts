import { PatientRepositoryPort } from '../../../application/ports/patient.repository.port';
import { Patient } from '../../../domain/aggregates/patient.aggregate';
import { PatientId } from '../../../domain/value-objects/patient-id.vo';
import { Email } from '../../../domain/value-objects/email.vo';
import { PrismaService } from '../prisma.service';
export declare class PrismaPatientRepositoryAdapter implements PatientRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(patient: Patient): Promise<void>;
    findById(id: PatientId): Promise<Patient | null>;
    findByEmail(email: Email): Promise<Patient | null>;
    findActivePatients(limit?: number, offset?: number): Promise<Patient[]>;
    findInactivePatients(limit?: number, offset?: number): Promise<Patient[]>;
    existsById(id: PatientId): Promise<boolean>;
    existsByEmail(email: Email): Promise<boolean>;
    delete(id: PatientId): Promise<void>;
    private toDomain;
    private toPersistence;
    private genderFromPrisma;
    private genderToPrisma;
}
