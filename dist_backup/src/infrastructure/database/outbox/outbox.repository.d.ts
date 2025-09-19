import { PrismaService } from '../prisma.service';
import { OutboxEventEntity } from './outbox.entity';
export declare class OutboxRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(event: OutboxEventEntity): Promise<OutboxEventEntity>;
    update(event: OutboxEventEntity): Promise<OutboxEventEntity>;
    findPendingEvents(limit?: number): Promise<OutboxEventEntity[]>;
    findByAggregateId(aggregateId: string): Promise<OutboxEventEntity[]>;
    deleteProcessedEvents(olderThanDays?: number): Promise<number>;
    private toDomain;
}
