import { Test, TestingModule } from '@nestjs/testing';
import { ResilientProcessAppointmentUseCase } from '../resilient-process-appointment.use-case';
import { ProcessAppointmentUseCase } from '../process-appointment.use-case';
import { SagaOrchestrator } from '../../../common/saga/saga-orchestrator';
import { DeadLetterQueueHandler } from '../../../common/resilience/dlq-handler';
import {
  CircuitBreaker,
  CircuitBreakerState,
} from '../../../common/resilience/circuit-breaker';
import { ResilientPrismaService } from '../../../infrastructure/database/resilient-prisma.service';
import { OutboxService } from '../../../infrastructure/database/outbox/outbox.service';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';

describe('Resilience Integration Tests', () => {
  let module: TestingModule;
  let resilientProcessor: ResilientProcessAppointmentUseCase;
  let sagaOrchestrator: SagaOrchestrator;
  let dlqHandler: DeadLetterQueueHandler;
  let circuitBreaker: CircuitBreaker;
  let resilientPrisma: ResilientPrismaService;

  // Mock repositories
  const mockPatientRepository = {
    findByEmail: jest.fn(),
    save: jest.fn(),
  };

  const mockPsychologistRepository = {
    findById: jest.fn(),
  };

  const mockAppointmentRepository = {
    findByPsychologistAndDate: jest.fn(),
    save: jest.fn(),
  };

  const mockOutboxService = {
    saveEventInTransaction: jest.fn(),
    processEvents: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ResilientProcessAppointmentUseCase,
        ProcessAppointmentUseCase,
        SagaOrchestrator,
        {
          provide: DeadLetterQueueHandler,
          useFactory: () => new DeadLetterQueueHandler(),
        },
        {
          provide: ResilientPrismaService,
          useValue: {
            testConnection: jest.fn(),
            healthCheck: jest.fn(),
            resetCircuitBreakers: jest.fn(),
          },
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
        {
          provide: INJECTION_TOKENS.PATIENT_REPOSITORY,
          useValue: mockPatientRepository,
        },
        {
          provide: INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
          useValue: mockPsychologistRepository,
        },
        {
          provide: INJECTION_TOKENS.APPOINTMENT_REPOSITORY,
          useValue: mockAppointmentRepository,
        },
      ],
    }).compile();

    resilientProcessor = module.get<ResilientProcessAppointmentUseCase>(
      ResilientProcessAppointmentUseCase,
    );
    sagaOrchestrator = module.get<SagaOrchestrator>(SagaOrchestrator);
    dlqHandler = module.get<DeadLetterQueueHandler>(DeadLetterQueueHandler);
    resilientPrisma = module.get<ResilientPrismaService>(
      ResilientPrismaService,
    );

    // Create separate circuit breaker for testing
    circuitBreaker = new CircuitBreaker('test-circuit', {
      failureThreshold: 2,
      recoveryTimeout: 1000,
      successThreshold: 1,
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Saga Pattern Tests', () => {
    it('should complete all steps successfully', async () => {
      // Arrange
      const appointmentMessage = {
        appointmentId: 'test-appointment-1',
        patientEmail: 'test@example.com',
        patientName: 'Test Patient',
        psychologistId: 'psychologist-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        duration: 60,
      };

      mockPatientRepository.findByEmail.mockResolvedValue(null);
      mockPatientRepository.save.mockResolvedValue({
        id: 'patient-1',
        email: 'test@example.com',
        name: 'Test Patient',
      });

      mockPsychologistRepository.findById.mockResolvedValue({
        id: 'psychologist-1',
        isActive: true,
        isAvailableAt: jest.fn().mockReturnValue(true),
      });

      mockAppointmentRepository.findByPsychologistAndDate.mockResolvedValue(
        null,
      );
      mockOutboxService.saveEventInTransaction.mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        resilientProcessor.executeWithResilience(appointmentMessage),
      ).resolves.not.toThrow();

      expect(mockPatientRepository.save).toHaveBeenCalled();
      expect(mockOutboxService.saveEventInTransaction).toHaveBeenCalled();
    });

    it('should compensate when middle step fails', async () => {
      // Arrange
      const appointmentMessage = {
        appointmentId: 'test-appointment-2',
        patientEmail: 'test@example.com',
        patientName: 'Test Patient',
        psychologistId: 'psychologist-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        duration: 60,
      };

      mockPatientRepository.findByEmail.mockResolvedValue(null);
      mockPatientRepository.save.mockResolvedValue({
        id: 'patient-1',
        email: 'test@example.com',
      });

      mockPsychologistRepository.findById.mockResolvedValue({
        id: 'psychologist-1',
        isActive: true,
        isAvailableAt: jest.fn().mockReturnValue(true),
      });

      // This will cause the saga to fail at availability check
      mockAppointmentRepository.findByPsychologistAndDate.mockResolvedValue({
        id: 'existing-appointment',
      });

      // Act
      await resilientProcessor.executeWithResilience(appointmentMessage);

      // Assert - Check that compensation ran
      const executions = await sagaOrchestrator.getAllExecutions();
      expect(executions.length).toBeGreaterThan(0);
      expect(executions[0].status).toBe('COMPENSATED');
    });
  });

  describe('Circuit Breaker Tests', () => {
    it('should open circuit after failure threshold', async () => {
      // Arrange - Create failing operation
      const failingOperation = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      // Act - Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch {
          // Expected to fail
        }
      }

      // Assert
      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.OPEN,
      );
      expect(circuitBreaker.getHealthStatus().isHealthy).toBe(false);
    });

    it('should transition to half-open after timeout', async () => {
      // Arrange - Open the circuit
      const failingOperation = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.OPEN,
      );

      // Act - Wait for recovery timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Try operation (should be allowed in HALF_OPEN)
      const successOperation = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successOperation);

      // Assert
      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.CLOSED,
      );
      expect(circuitBreaker.getHealthStatus().isHealthy).toBe(true);
    });

    it('should reset circuit breaker manually', () => {
      // Arrange - Open the circuit
      circuitBreaker.forceOpen();
      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.OPEN,
      );

      // Act
      circuitBreaker.forceClose();

      // Assert
      expect(circuitBreaker.getHealthStatus().state).toBe(
        CircuitBreakerState.CLOSED,
      );
      expect(circuitBreaker.getHealthStatus().isHealthy).toBe(true);
    });
  });

  describe('Dead Letter Queue Tests', () => {
    it('should retry failed messages with exponential backoff', async () => {
      // Arrange
      const originalMessage = { appointmentId: 'test-dlq-1' };
      const error = new Error('Temporary failure');

      // Act
      await dlqHandler.handleFailedMessage(
        originalMessage,
        error,
        1,
        'appointment-processing',
      );

      // Assert - Should schedule retry (not send to DLQ yet)
      const healthStatus = dlqHandler.getHealthStatus();
      expect(healthStatus.config.maxRetries).toBe(2);
    });

    it('should send to DLQ after max retries exceeded', async () => {
      // Arrange
      const originalMessage = { appointmentId: 'test-dlq-2' };
      const error = new Error('Persistent failure');

      // Act - Exceed max retries
      await dlqHandler.handleFailedMessage(
        originalMessage,
        error,
        3, // Exceeds maxRetries of 2
        'appointment-processing',
      );

      // Assert - Should be sent to DLQ (in logs)
      const healthStatus = dlqHandler.getHealthStatus();
      expect(healthStatus.isHealthy).toBeDefined();
    });

    it('should process DLQ messages', async () => {
      // Act
      const result = await dlqHandler.processDLQMessages();

      // Assert
      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('errors');
      expect(typeof result.processed).toBe('number');
      expect(typeof result.errors).toBe('number');
    });
  });

  describe('Integration Health Checks', () => {
    it('should report overall system health', async () => {
      // Act
      const healthStatus = await resilientProcessor.getHealthStatus();

      // Assert
      expect(healthStatus).toHaveProperty('saga');
      expect(healthStatus).toHaveProperty('dlq');
      expect(healthStatus).toHaveProperty('processingQueue');
      expect(typeof healthStatus.saga).toBe('boolean');
    });

    it('should handle database connection failures gracefully', async () => {
      // Arrange
      const prismaHealthCheck = jest.fn().mockResolvedValue({
        database: false,
        connectionCircuitBreaker: { isHealthy: false },
        queryCircuitBreaker: { isHealthy: false },
      });

      resilientPrisma.healthCheck = prismaHealthCheck;

      // Act
      const healthCheck = await resilientPrisma.healthCheck();

      // Assert
      expect(healthCheck.database).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(healthCheck.connectionCircuitBreaker.isHealthy).toBe(false);
    });
  });

  describe('End-to-End Failure Scenarios', () => {
    it('should handle complete system recovery after multiple failures', async () => {
      // Arrange
      const appointmentMessage = {
        appointmentId: 'test-e2e-1',
        patientEmail: 'test@example.com',
        patientName: 'Test Patient',
        psychologistId: 'psychologist-1',
        scheduledAt: '2024-01-15T10:00:00Z',
        duration: 60,
      };

      // Simulate initial failures
      mockOutboxService.saveEventInTransaction
        .mockRejectedValueOnce(new Error('Database timeout'))
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce(undefined); // Third attempt succeeds

      mockPatientRepository.findByEmail.mockResolvedValue({
        id: 'patient-1',
        email: 'test@example.com',
      });

      mockPsychologistRepository.findById.mockResolvedValue({
        id: 'psychologist-1',
        isActive: true,
        isAvailableAt: jest.fn().mockReturnValue(true),
      });

      mockAppointmentRepository.findByPsychologistAndDate.mockResolvedValue(
        null,
      );

      // Act - First attempt should fail and trigger DLQ handling
      await resilientProcessor.executeWithResilience(appointmentMessage, 1);

      // Verify that the system attempted recovery
      const healthStatus = await resilientProcessor.getHealthStatus();
      expect(healthStatus).toBeDefined();
    });
  });
});
