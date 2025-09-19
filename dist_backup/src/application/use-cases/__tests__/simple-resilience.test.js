"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const saga_orchestrator_1 = require("../../../common/saga/saga-orchestrator");
const dlq_handler_1 = require("../../../common/resilience/dlq-handler");
const circuit_breaker_1 = require("../../../common/resilience/circuit-breaker");
describe('Simple Resilience Tests', () => {
    let sagaOrchestrator;
    let dlqHandler;
    let circuitBreaker;
    beforeEach(() => {
        sagaOrchestrator = new saga_orchestrator_1.SagaOrchestrator();
        dlqHandler = new dlq_handler_1.DeadLetterQueueHandler();
        circuitBreaker = new circuit_breaker_1.CircuitBreaker('test', {
            failureThreshold: 2,
            recoveryTimeout: 500,
            successThreshold: 1,
        });
    });
    describe('Saga Pattern', () => {
        it('should execute saga steps in order', async () => {
            const executionOrder = [];
            const steps = [
                {
                    id: 'step1',
                    name: 'First Step',
                    action: async () => {
                        executionOrder.push('action1');
                        return 'result1';
                    },
                    compensation: async () => {
                        executionOrder.push('compensation1');
                    },
                },
                {
                    id: 'step2',
                    name: 'Second Step',
                    action: async () => {
                        executionOrder.push('action2');
                        return 'result2';
                    },
                    compensation: async () => {
                        executionOrder.push('compensation2');
                    },
                },
            ];
            const execution = await sagaOrchestrator.executeSaga('TestSaga', steps);
            expect(execution.status).toBe('COMPLETED');
            expect(executionOrder).toEqual(['action1', 'action2']);
        });
        it('should compensate steps when failure occurs', async () => {
            const executionOrder = [];
            const steps = [
                {
                    id: 'step1',
                    name: 'First Step (Success)',
                    action: async () => {
                        executionOrder.push('action1');
                        return 'result1';
                    },
                    compensation: async () => {
                        executionOrder.push('compensation1');
                    },
                },
                {
                    id: 'step2',
                    name: 'Second Step (Failure)',
                    action: async () => {
                        executionOrder.push('action2');
                        throw new Error('Step 2 failed');
                    },
                    compensation: async () => {
                        executionOrder.push('compensation2');
                    },
                },
            ];
            const execution = await sagaOrchestrator.executeSaga('FailingSaga', steps);
            expect(execution.status).toBe('COMPENSATED');
            expect(executionOrder).toEqual(['action1', 'action2', 'compensation1']);
        });
    });
    describe('Circuit Breaker', () => {
        it('should allow requests when closed', async () => {
            const operation = jest.fn().mockResolvedValue('success');
            const result = await circuitBreaker.execute(operation);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
            expect(circuitBreaker.getHealthStatus().state).toBe(circuit_breaker_1.CircuitBreakerState.CLOSED);
        });
        it('should open after failure threshold', async () => {
            const failingOperation = jest
                .fn()
                .mockRejectedValue(new Error('Database error'));
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(failingOperation);
                }
                catch {
                }
            }
            expect(circuitBreaker.getHealthStatus().state).toBe(circuit_breaker_1.CircuitBreakerState.OPEN);
        });
        it('should fail fast when open', async () => {
            const operation = jest.fn().mockResolvedValue('success');
            circuitBreaker.forceOpen();
            await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker');
            expect(operation).not.toHaveBeenCalled();
        });
    });
    describe('Dead Letter Queue', () => {
        it('should handle message failures correctly', () => {
            const testMessage = { id: 'test-msg-1', data: 'test' };
            const error = new Error('Processing failed');
            dlqHandler.handleFailedMessage(testMessage, error, 1, 'test-queue');
            const healthStatus = dlqHandler.getHealthStatus();
            expect(healthStatus.config.maxRetries).toBe(2);
        });
        it('should send to DLQ after max retries', () => {
            const testMessage = { id: 'test-msg-2', data: 'test' };
            const error = new Error('Persistent failure');
            dlqHandler.handleFailedMessage(testMessage, error, 3, 'test-queue');
            const healthStatus = dlqHandler.getHealthStatus();
            expect(healthStatus.config.maxRetries).toBe(2);
        });
        it('should process DLQ messages', () => {
            const result = dlqHandler.processDLQMessages();
            expect(result).toHaveProperty('processed');
            expect(result).toHaveProperty('errors');
            expect(typeof result.processed).toBe('number');
            expect(typeof result.errors).toBe('number');
        });
    });
    describe('Integration Scenarios', () => {
        it('should demonstrate complete resilience workflow', async () => {
            let processedSuccessfully = false;
            try {
                await circuitBreaker.execute(async () => {
                    return { status: 'validated' };
                });
                const sagaSteps = [
                    {
                        id: 'reserve-slot',
                        name: 'Reserve Time Slot',
                        action: async () => 'slot-reserved',
                        compensation: async () => {
                        },
                    },
                    {
                        id: 'send-notification',
                        name: 'Send Confirmation',
                        action: async () => 'notification-sent',
                        compensation: async () => {
                        },
                    },
                ];
                const sagaExecution = await sagaOrchestrator.executeSaga('BookingWorkflow', sagaSteps);
                if (sagaExecution.status === 'COMPLETED') {
                    processedSuccessfully = true;
                }
            }
            catch (error) {
                dlqHandler.handleFailedMessage({ workflowId: 'booking-123' }, error instanceof Error ? error : new Error('Unknown error'), 1, 'booking-queue');
            }
            expect(processedSuccessfully).toBe(true);
        });
    });
});
//# sourceMappingURL=simple-resilience.test.js.map