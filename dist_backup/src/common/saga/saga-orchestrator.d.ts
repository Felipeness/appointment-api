import { SagaStep, SagaStatus, SagaExecution } from './saga.types';
export declare class SagaOrchestrator {
    private readonly logger;
    private executions;
    executeSaga(sagaName: string, steps: SagaStep[], initialData?: Record<string, unknown>): Promise<SagaExecution>;
    private executeSteps;
    private executeStepWithRetry;
    private compensate;
    getSagaExecution(sagaId: string): SagaExecution | undefined;
    getAllExecutions(): SagaExecution[];
    getExecutionsByStatus(status: SagaStatus): SagaExecution[];
    cleanupExecutions(olderThanHours?: number): number;
    private delay;
}
