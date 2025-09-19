"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SagaOrchestrator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const saga_types_1 = require("./saga.types");
let SagaOrchestrator = SagaOrchestrator_1 = class SagaOrchestrator {
    logger = new common_1.Logger(SagaOrchestrator_1.name);
    executions = new Map();
    async executeSaga(sagaName, steps, initialData = {}) {
        const sagaId = (0, uuid_1.v4)();
        const context = {
            sagaId,
            data: initialData,
            completedSteps: [],
            retryCount: 0,
        };
        const execution = {
            sagaId,
            status: saga_types_1.SagaStatus.PENDING,
            currentStepIndex: 0,
            context,
            startedAt: new Date(),
        };
        this.executions.set(sagaId, execution);
        this.logger.log(`Starting saga ${sagaName} with ID: ${sagaId}`);
        try {
            execution.status = saga_types_1.SagaStatus.IN_PROGRESS;
            await this.executeSteps(execution, steps);
            execution.status = saga_types_1.SagaStatus.COMPLETED;
            execution.completedAt = new Date();
            this.logger.log(`Saga ${sagaName} completed successfully: ${sagaId}`);
        }
        catch (error) {
            this.logger.error(`Saga ${sagaName} failed: ${sagaId}`, error);
            execution.error =
                error instanceof Error ? error.message : 'Unknown error';
            await this.compensate(execution, steps);
        }
        return execution;
    }
    async executeSteps(execution, steps) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            execution.currentStepIndex = i;
            execution.context.currentStep = step.id;
            this.logger.log(`Executing step ${step.name} (${step.id}) in saga ${execution.sagaId}`);
            try {
                const result = await this.executeStepWithRetry(step);
                execution.context.data[`${step.id}_result`] = result;
                execution.context.completedSteps.push(step.id);
                this.logger.log(`Step ${step.name} completed successfully in saga ${execution.sagaId}`);
            }
            catch (error) {
                this.logger.error(`Step ${step.name} failed in saga ${execution.sagaId}`, error);
                throw error;
            }
        }
    }
    async executeStepWithRetry(step) {
        const maxRetries = step.maxRetries || 3;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this.logger.log(`Retrying step ${step.name} (attempt ${attempt}/${maxRetries})`);
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
                return await step.action();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                if (!step.retryable || attempt >= maxRetries) {
                    throw lastError;
                }
                this.logger.warn(`Step ${step.name} failed, retrying... (${attempt + 1}/${maxRetries})`);
            }
        }
        throw lastError;
    }
    async compensate(execution, steps) {
        execution.status = saga_types_1.SagaStatus.COMPENSATING;
        this.logger.log(`Starting compensation for saga ${execution.sagaId}`);
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
            }
            catch (error) {
                this.logger.error(`Failed to compensate step ${step.name}`, error);
            }
        }
        execution.status = saga_types_1.SagaStatus.COMPENSATED;
        execution.completedAt = new Date();
        this.logger.log(`Saga ${execution.sagaId} compensated`);
    }
    getSagaExecution(sagaId) {
        return this.executions.get(sagaId);
    }
    getAllExecutions() {
        return Array.from(this.executions.values());
    }
    getExecutionsByStatus(status) {
        return Array.from(this.executions.values()).filter((exec) => exec.status === status);
    }
    cleanupExecutions(olderThanHours = 24) {
        const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        let cleanedCount = 0;
        for (const [sagaId, execution] of this.executions.entries()) {
            if (execution.startedAt < cutoffTime &&
                (execution.status === saga_types_1.SagaStatus.COMPLETED ||
                    execution.status === saga_types_1.SagaStatus.COMPENSATED ||
                    execution.status === saga_types_1.SagaStatus.FAILED)) {
                this.executions.delete(sagaId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.log(`Cleaned up ${cleanedCount} old saga executions`);
        }
        return cleanedCount;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.SagaOrchestrator = SagaOrchestrator;
exports.SagaOrchestrator = SagaOrchestrator = SagaOrchestrator_1 = __decorate([
    (0, common_1.Injectable)()
], SagaOrchestrator);
//# sourceMappingURL=saga-orchestrator.js.map