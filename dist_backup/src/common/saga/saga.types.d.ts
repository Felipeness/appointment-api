export interface SagaStep {
    id: string;
    name: string;
    action: () => Promise<unknown>;
    compensation: () => Promise<unknown>;
    retryable?: boolean;
    maxRetries?: number;
}
export interface SagaContext {
    sagaId: string;
    data: Record<string, unknown>;
    completedSteps: string[];
    currentStep?: string;
    error?: Error;
    retryCount: number;
}
export declare enum SagaStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    COMPENSATING = "COMPENSATING",
    COMPENSATED = "COMPENSATED",
    FAILED = "FAILED"
}
export interface SagaExecution {
    sagaId: string;
    status: SagaStatus;
    currentStepIndex: number;
    context: SagaContext;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}
