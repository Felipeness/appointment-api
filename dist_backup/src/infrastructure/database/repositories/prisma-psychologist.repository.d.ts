import { PsychologistRepository } from '../../../domain/repositories/psychologist.repository';
import { Psychologist } from '../../../domain/entities/psychologist.entity';
import { PrismaService } from '../prisma.service';
export declare class PrismaPsychologistRepository implements PsychologistRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Psychologist | null>;
    findByEmail(email: string): Promise<Psychologist | null>;
    findAll(): Promise<Psychologist[]>;
    save(psychologist: Psychologist): Promise<Psychologist>;
    update(psychologist: Psychologist): Promise<Psychologist>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
