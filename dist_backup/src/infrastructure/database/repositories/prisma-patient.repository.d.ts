import { PatientRepository } from '../../../domain/repositories/patient.repository';
import { Patient } from '../../../domain/entities/patient.entity';
import { PrismaService } from '../prisma.service';
export declare class PrismaPatientRepository implements PatientRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Patient | null>;
    findByEmail(email: string): Promise<Patient | null>;
    findAll(): Promise<Patient[]>;
    save(patient: Patient): Promise<Patient>;
    update(patient: Patient): Promise<Patient>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
