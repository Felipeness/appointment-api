import { ConfigService } from '@nestjs/config';
import { MessageQueue } from '../../application/interfaces/message-queue.interface';
export interface EnterpriseMessage {
    id: string;
    type: string;
    version: string;
    timestamp: string;
    source: string;
    data: Record<string, unknown>;
    traceId?: string;
    correlationId?: string;
    retryCount?: number;
    priority?: 'high' | 'normal' | 'low';
}
export declare class AwsSqsProducer implements MessageQueue {
    private readonly configService;
    private readonly logger;
    private readonly circuitBreaker;
    private readonly sqsClient;
    private readonly queueUrl;
    constructor(configService: ConfigService);
    sendMessage(message: Record<string, unknown>, options?: {
        delaySeconds?: number;
        messageGroupId?: string;
        deduplicationId?: string;
        priority?: 'high' | 'normal' | 'low';
        traceId?: string;
    }): Promise<void>;
    sendBatchMessages(messages: Record<string, unknown>[], options?: {
        messageGroupId?: string;
        priority?: 'high' | 'normal' | 'low';
        traceId?: string;
    }): Promise<void>;
    receiveMessages(): Promise<Record<string, unknown>[]>;
    deleteMessage(): Promise<void>;
    private wrapMessage;
    private inferMessageType;
    private generateMessageId;
    private generateTraceId;
    private chunkArray;
    getHealthStatus(): {
        isHealthy: boolean;
        circuitBreakerStatus: Record<string, unknown>;
        stats: {
            messagesSent: number;
            lastMessageTime?: string;
        };
    };
    resetCircuitBreaker(): void;
    openCircuitBreaker(): void;
}
