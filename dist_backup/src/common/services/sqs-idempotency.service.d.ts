import type { Message } from '@aws-sdk/client-sqs';
export interface SQSIdempotencyRecord {
    messageId: string;
    messageGroupId?: string;
    deduplicationId?: string;
    bodyHash: string;
    processedAt: Date;
    expiresAt: Date;
    processingResult: 'success' | 'failure' | 'retry';
    metadata?: Record<string, any>;
}
export declare class SQSIdempotencyService {
    private readonly logger;
    private readonly processedMessages;
    private readonly TTL_SECONDS;
    constructor();
    isProcessed(message: Message): boolean;
    markAsProcessed(message: Message, result: 'success' | 'failure' | 'retry', metadata?: Record<string, unknown>): void;
    getProcessingRecord(message: Message): SQSIdempotencyRecord | null;
    generateDeduplicationId(messageBody: any, context?: Record<string, any>): string;
    generateMessageGroupId(messageBody: any): string;
    validateMessageUniqueness(message: Message): {
        isUnique: boolean;
        existingRecord?: SQSIdempotencyRecord;
    };
    private cleanup;
    private buildMessageKey;
    private hashMessageBody;
    getStats(): {
        totalProcessed: number;
        successCount: number;
        failureCount: number;
        retryCount: number;
        oldestRecord?: Date;
        newestRecord?: Date;
    };
}
