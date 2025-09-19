import { OutboxRepository } from './outbox.repository';
import { OutboxEventEntity } from './outbox.entity';
import { PrismaService } from '../prisma.service';
export interface DomainEvent {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: any;
}
export declare class OutboxService {
    private readonly outboxRepository;
    private readonly prisma;
    private readonly logger;
    constructor(outboxRepository: OutboxRepository, prisma: PrismaService);
    saveEventInTransaction(event: DomainEvent, businessOperation: (prismaTransaction: any) => Promise<any>): Promise<void>;
    saveEvent(event: DomainEvent): Promise<OutboxEventEntity>;
    markEventAsProcessing(eventId: string): Promise<OutboxEventEntity>;
    markEventAsProcessed(eventId: string): Promise<OutboxEventEntity>;
    markEventAsFailed(eventId: string, error: string): Promise<OutboxEventEntity>;
    getPendingEvents(limit?: number): Promise<OutboxEventEntity[]>;
    cleanupProcessedEvents(olderThanDays?: number): Promise<number>;
}
