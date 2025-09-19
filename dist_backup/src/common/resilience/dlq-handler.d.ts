export interface DLQMessage {
    id: string;
    originalMessage: Record<string, unknown>;
    failureReason: string;
    attemptCount: number;
    firstFailedAt: Date;
    lastFailedAt: Date;
    originalQueue: string;
}
export interface DLQConfig {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    maxRetryDelayMs: number;
}
export declare class DeadLetterQueueHandler {
    private readonly logger;
    private readonly circuitBreaker;
    private readonly config;
    constructor();
    handleFailedMessage(originalMessage: Record<string, unknown>, error: Error, attemptCount: number, originalQueue: string): void;
    private sendToDLQ;
    private scheduleRetry;
    private retryMessage;
    processDLQMessages(): {
        processed: number;
        errors: number;
    };
    private calculateRetryDelay;
    private extractFirstFailedAt;
    private generateId;
    private storeDLQMessage;
    private getDLQMessages;
    private removeDLQMessage;
    private updateDLQMessageFailure;
    private reprocessMessage;
    private reprocessDLQMessage;
    private notifyDLQMessage;
    private escalateToManualIntervention;
    getHealthStatus(): {
        isHealthy: boolean;
        circuitBreakerStatus: Record<string, unknown>;
        config: DLQConfig;
    };
}
