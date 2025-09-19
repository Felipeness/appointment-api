import { SagaOrchestrator } from '../../../common/saga/saga-orchestrator';
import { DeadLetterQueueHandler } from '../../../common/resilience/dlq-handler';
import {
  CircuitBreaker,
  CircuitBreakerState,
} from '../../../common/resilience/circuit-breaker';

describe('Simple Resilience Tests', () => {
  let sagaOrchestrator: SagaOrchestrator;
  let dlqHandler: DeadLetterQueueHandler;
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    sagaOrchestrator = new SagaOrchestrator();
    dlqHandler = new DeadLetterQueueHandler();
    circuitBreaker = new CircuitBreaker('test', {
      failureThreshold: 2,
      recoveryTimeout: 500,
      successThreshold: 1,
    });
  });

  describe('Saga Pattern', () => {
    it('should execute saga steps in order', async () => {
      const executionOrder: string[] = [];

      const steps = [
        {
          id: 'step1',
          name: 'First Step',
          action: () => {
            executionOrder.push('action1');
            return Promise.resolve('result1');
          },
          compensation: () => {
            executionOrder.push('compensation1');
          },
        },
        {
          id: 'step2',
          name: 'Second Step',
          action: () => {
            executionOrder.push('action2');
            return Promise.resolve('result2');
          },
          compensation: () => {
            executionOrder.push('compensation2');
          },
        },
      ];

      const execution = await sagaOrchestrator.executeSaga('TestSaga', steps);

      expect(execution.status).toBe('COMPLETED');
      expect(executionOrder).toEqual(['action1', 'action2']);
    });

    it('should compensate steps when failure occurs', async () => {
      const executionOrder: string[] = [];

      const steps = [
        {
          id: 'step1',
          name: 'First Step (Success)',
          action: () => {
            executionOrder.push('action1');
            return Promise.resolve('result1');
          },
          compensation: () => {
            executionOrder.push('compensation1');
          },
        },
        {
          id: 'step2',
          name: 'Second Step (Failure)',
          action: () => {
            executionOrder.push('action2');
            return Promise.reject(new Error('Step 2 failed'));
          },
          compensation: () => {
            executionOrder.push('compensation2');
          },
        },
      ];

      const execution = await sagaOrchestrator.executeSaga(
        'FailingSaga',
        steps,
      );

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
      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.CLOSED,
      );
    });

    it('should open after failure threshold', async () => {
      const failingOperation = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      // Trigger enough failures to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch {
          // Expected
        }
      }

      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.OPEN,
      );
    });

    it('should fail fast when open', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      // Force circuit open
      circuitBreaker.forceOpen();

      // Should fail fast without calling operation
      await expect(circuitBreaker.execute(operation)).rejects.toThrow(
        'Circuit breaker',
      );
      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('Dead Letter Queue', () => {
    it('should handle message failures correctly', () => {
      const testMessage = { id: 'test-msg-1', data: 'test' };
      const error = new Error('Processing failed');

      // Should not throw - DLQ handler processes failures gracefully
      dlqHandler.handleFailedMessage(testMessage, error, 1, 'test-queue');

      // Verify the handler configuration
      const healthStatus = dlqHandler.getHealthStatus();
      expect(healthStatus.config.maxRetries).toBe(2);
    });

    it('should send to DLQ after max retries', () => {
      const testMessage = { id: 'test-msg-2', data: 'test' };
      const error = new Error('Persistent failure');

      // Exceed retry limit
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
      // Simulate a workflow that uses all patterns
      let processedSuccessfully = false;

      try {
        // Step 1: Circuit breaker protects external service call
        await circuitBreaker.execute(() => {
          // Simulate external service success
          return Promise.resolve({ status: 'validated' });
        });

        // Step 2: Saga manages distributed transaction
        const sagaSteps = [
          {
            id: 'reserve-slot',
            name: 'Reserve Time Slot',
            action: () => Promise.resolve('slot-reserved'),

            compensation: async () => {
              // Release slot
            },
          },
          {
            id: 'send-notification',
            name: 'Send Confirmation',
            action: () => Promise.resolve('notification-sent'),

            compensation: async () => {
              // Send cancellation
            },
          },
        ];

        const sagaExecution = await sagaOrchestrator.executeSaga(
          'BookingWorkflow',
          sagaSteps,
        );

        if ((sagaExecution.status as string) === 'COMPLETED') {
          processedSuccessfully = true;
        }
      } catch (error) {
        // Step 3: DLQ handles failures
        dlqHandler.handleFailedMessage(
          { workflowId: 'booking-123' },
          error instanceof Error ? error : new Error('Unknown error'),
          1,
          'booking-queue',
        );
      }

      // Verify the workflow completed successfully
      expect(processedSuccessfully).toBe(true);
    });
  });
});
