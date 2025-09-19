import { PrismaService } from '../prisma.service';
import { AwsSqsProducer } from '../../messaging/aws-sqs.producer';
export interface OutboxEvent {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: Record<string, unknown>;
    version?: number;
}
export interface OutboxEventRecord {
    id: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: any;
    status: string;
    version: number;
    retryCount: number;
    error?: string | null;
    createdAt: Date;
    processedAt?: Date | null;
    maxRetries: number;
}
export declare class TransactionalOutboxService {
    private readonly prisma;
    private readonly messageProducer;
    private readonly logger;
    private readonly MAX_BATCH_SIZE;
    private readonly MAX_RETRIES;
    constructor(prisma: PrismaService, messageProducer: AwsSqsProducer);
    storeEvent(event: OutboxEvent, tx?: typeof this.prisma): Promise<void>;
    storeEvents(events: OutboxEvent[], tx?: typeof this.prisma): Promise<void>;
    processOutboxEvents(): Promise<void>;
    private processEvent;
    private handleEventError;
    getOutboxStats(): Promise<{
        pending: number;
        processing: number;
        processed: number;
        failed: number;
    }>;
    cleanupOldEvents(): Promise<void>;
}
