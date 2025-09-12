import { Patient } from '../entities/patient.entity';

export interface PatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByEmail(email: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  save(patient: Patient): Promise<Patient>;
  update(patient: Patient): Promise<Patient>;
  delete(id: string): Promise<void>;
}
