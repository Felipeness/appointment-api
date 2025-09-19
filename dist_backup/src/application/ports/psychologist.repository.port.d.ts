import { Psychologist } from '../../domain/entities/psychologist.entity';
import { PsychologistId } from '../../domain/value-objects/psychologist-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
export interface PsychologistRepositoryPort {
    save(psychologist: Psychologist): Promise<void>;
    findById(id: PsychologistId): Promise<Psychologist | null>;
    findByEmail(email: Email): Promise<Psychologist | null>;
    findAvailablePsychologists(date?: Date): Promise<Psychologist[]>;
    existsById(id: PsychologistId): Promise<boolean>;
    existsByEmail(email: Email): Promise<boolean>;
    delete(id: PsychologistId): Promise<void>;
}
