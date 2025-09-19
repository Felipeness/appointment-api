export declare enum CircuitBreakerState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    successThreshold: number;
}
export interface CircuitBreakerMetrics {
    totalRequests: number;
    successCount: number;
    failureCount: number;
    state: CircuitBreakerState;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
}
export declare class CircuitBreaker {
    private readonly name;
    private readonly logger;
    private state;
    private failureCount;
    private successCount;
    private totalRequests;
    private lastFailureTime?;
    private lastSuccessTime?;
    private nextAttemptTime?;
    private readonly config;
    constructor(name: string, config?: Partial<CircuitBreakerConfig>);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private canExecute;
    private onSuccess;
    private onFailure;
    private open;
    private close;
    private resetFailureCount;
    forceOpen(): void;
    forceClose(): void;
    getMetrics(): CircuitBreakerMetrics;
    getHealthStatus(): {
        isHealthy: boolean;
        state: CircuitBreakerState;
        failureRate: number;
        nextAttemptTime?: Date;
    };
}
