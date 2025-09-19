import { OnModuleInit } from '@nestjs/common';
import { OutboxService } from '../database/outbox/outbox.service';
import type { MessageQueue } from '../../application/interfaces/message-queue.interface';
export declare class OutboxPublisherService implements OnModuleInit {
    private readonly outboxService;
    private readonly messageQueue;
    private readonly logger;
    private isProcessing;
    private processingInterval;
    constructor(outboxService: OutboxService, messageQueue: MessageQueue);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private startProcessing;
    private processOutboxEvents;
    private processEvent;
    private publishEventToQueue;
    private handleFailedEvent;
    private cleanupProcessedEvents;
    triggerProcessing(): Promise<void>;
    getHealth(): Promise<{
        isProcessing: boolean;
        pendingEvents: number;
        lastProcessed: Date;
    }>;
}
