export interface OutboxEvent {
    id: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: any;
    createdAt: Date;
    processedAt?: Date;
    retryCount: number;
    maxRetries: number;
    status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
    error?: string;
    version: number;
}
export declare class OutboxEventEntity implements OutboxEvent {
    readonly id: string;
    readonly aggregateId: string;
    readonly aggregateType: string;
    readonly eventType: string;
    readonly eventData: any;
    readonly createdAt: Date;
    readonly processedAt?: Date | undefined;
    readonly retryCount: number;
    readonly maxRetries: number;
    readonly status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
    readonly error?: string | undefined;
    readonly version: number;
    constructor(id: string, aggregateId: string, aggregateType: string, eventType: string, eventData: any, createdAt?: Date, processedAt?: Date | undefined, retryCount?: number, maxRetries?: number, status?: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED', error?: string | undefined, version?: number);
    markAsProcessing(): OutboxEventEntity;
    markAsProcessed(): OutboxEventEntity;
    markAsFailed(error: string): OutboxEventEntity;
    canRetry(): boolean;
}
