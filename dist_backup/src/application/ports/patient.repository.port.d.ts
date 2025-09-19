import { Patient } from '../../domain/aggregates/patient.aggregate';
import { PatientId } from '../../domain/value-objects/patient-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
export interface PatientRepositoryPort {
    save(patient: Patient): Promise<void>;
    findById(id: PatientId): Promise<Patient | null>;
    findByEmail(email: Email): Promise<Patient | null>;
    findActivePatients(limit?: number, offset?: number): Promise<Patient[]>;
    findInactivePatients(limit?: number, offset?: number): Promise<Patient[]>;
    existsById(id: PatientId): Promise<boolean>;
    existsByEmail(email: Email): Promise<boolean>;
    delete(id: PatientId): Promise<void>;
}
