import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SagaStep, SagaContext, SagaStatus, SagaExecution } from './saga.types';

@Injectable()
export class SagaOrchestrator {
  private readonly logger = new Logger(SagaOrchestrator.name);
  private executions = new Map<string, SagaExecution>();

  async executeSaga(
    sagaName: string,
    steps: SagaStep[],
    initialData: Record<string, any> = {},
  ): Promise<SagaExecution> {
    const sagaId = uuidv4();
    const context: SagaContext = {
      sagaId,
      data: initialData,
      completedSteps: [],
      retryCount: 0,
    };

    const execution: SagaExecution = {
      sagaId,
      status: SagaStatus.PENDING,
      currentStepIndex: 0,
      context,
      startedAt: new Date(),
    };

    this.executions.set(sagaId, execution);
    this.logger.log(`Starting saga ${sagaName} with ID: ${sagaId}`);

    try {
      execution.status = SagaStatus.IN_PROGRESS;
      await this.executeSteps(execution, steps);

      execution.status = SagaStatus.COMPLETED;
      execution.completedAt = new Date();
      this.logger.log(`Saga ${sagaName} completed successfully: ${sagaId}`);
    } catch (error) {
      this.logger.error(`Saga ${sagaName} failed: ${sagaId}`, error);
      execution.error =
        error instanceof Error ? error.message : 'Unknown error';

      // Start compensation
      await this.compensate(execution, steps);
    }

    return execution;
  }

  private async executeSteps(
    execution: SagaExecution,
    steps: SagaStep[],
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      execution.currentStepIndex = i;
      execution.context.currentStep = step.id;

      this.logger.log(
        `Executing step ${step.name} (${step.id}) in saga ${execution.sagaId}`,
      );

      try {
        const result = await this.executeStepWithRetry(step, execution.context);

        // Store step result in context
        execution.context.data[`${step.id}_result`] = result;
        execution.context.completedSteps.push(step.id);

        this.logger.log(
          `Step ${step.name} completed successfully in saga ${execution.sagaId}`,
        );
      } catch (error) {
        this.logger.error(
          `Step ${step.name} failed in saga ${execution.sagaId}`,
          error,
        );
        throw error;
      }
    }
  }

  private async executeStepWithRetry(
    step: SagaStep,
    context: SagaContext,
  ): Promise<any> {
    const maxRetries = step.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.log(
            `Retrying step ${step.name} (attempt ${attempt}/${maxRetries})`,
          );
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }

        return await step.action();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (!step.retryable || attempt >= maxRetries) {
          throw lastError;
        }

        this.logger.warn(
          `Step ${step.name} failed, retrying... (${attempt + 1}/${maxRetries})`,
        );
      }
    }

    throw lastError!;
  }

  private async compensate(
    execution: SagaExecution,
    steps: SagaStep[],
  ): Promise<void> {
    execution.status = SagaStatus.COMPENSATING;
    this.logger.log(`Starting compensation for saga ${execution.sagaId}`);

    // Compensate completed steps in reverse order
    const completedSteps = execution.context.completedSteps.slice().reverse();

    for (const stepId of completedSteps) {
      const step = steps.find((s) => s.id === stepId);
      if (!step) {
        this.logger.warn(`Step ${stepId} not found for compensation`);
        continue;
      }

      try {
        this.logger.log(`Compensating step ${step.name} (${step.id})`);
        await step.compensation();
        this.logger.log(`Step ${step.name} compensated successfully`);
      } catch (error) {
        this.logger.error(`Failed to compensate step ${step.name}`, error);
        // Continue with other compensations even if one fails
      }
    }

    execution.status = SagaStatus.COMPENSATED;
    execution.completedAt = new Date();
    this.logger.log(`Saga ${execution.sagaId} compensated`);
  }

  async getSagaExecution(sagaId: string): Promise<SagaExecution | undefined> {
    return this.executions.get(sagaId);
  }

  async getAllExecutions(): Promise<SagaExecution[]> {
    return Array.from(this.executions.values());
  }

  async getExecutionsByStatus(status: SagaStatus): Promise<SagaExecution[]> {
    return Array.from(this.executions.values()).filter(
      (exec) => exec.status === status,
    );
  }

  // Cleanup old executions
  async cleanupExecutions(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sagaId, execution] of this.executions.entries()) {
      if (
        execution.startedAt < cutoffTime &&
        (execution.status === SagaStatus.COMPLETED ||
          execution.status === SagaStatus.COMPENSATED ||
          execution.status === SagaStatus.FAILED)
      ) {
        this.executions.delete(sagaId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old saga executions`);
    }

    return cleanedCount;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
