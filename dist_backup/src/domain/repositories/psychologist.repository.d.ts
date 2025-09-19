import { Psychologist } from '../entities/psychologist.entity';
export interface PsychologistRepository {
    findById(id: string): Promise<Psychologist | null>;
    findByEmail(email: string): Promise<Psychologist | null>;
    findAll(): Promise<Psychologist[]>;
    save(psychologist: Psychologist): Promise<Psychologist>;
    update(psychologist: Psychologist): Promise<Psychologist>;
    delete(id: string): Promise<void>;
}
