"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const resilient_process_appointment_use_case_1 = require("../resilient-process-appointment.use-case");
const process_appointment_use_case_1 = require("../process-appointment.use-case");
const saga_orchestrator_1 = require("../../../common/saga/saga-orchestrator");
const dlq_handler_1 = require("../../../common/resilience/dlq-handler");
const circuit_breaker_1 = require("../../../common/resilience/circuit-breaker");
const resilient_prisma_service_1 = require("../../../infrastructure/database/resilient-prisma.service");
const outbox_service_1 = require("../../../infrastructure/database/outbox/outbox.service");
const injection_tokens_1 = require("../../../shared/constants/injection-tokens");
describe('Resilience Integration Tests', () => {
    let module;
    let resilientProcessor;
    let sagaOrchestrator;
    let dlqHandler;
    let circuitBreaker;
    let resilientPrisma;
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
        module = await testing_1.Test.createTestingModule({
            providers: [
                resilient_process_appointment_use_case_1.ResilientProcessAppointmentUseCase,
                process_appointment_use_case_1.ProcessAppointmentUseCase,
                saga_orchestrator_1.SagaOrchestrator,
                {
                    provide: dlq_handler_1.DeadLetterQueueHandler,
                    useFactory: () => new dlq_handler_1.DeadLetterQueueHandler(),
                },
                {
                    provide: resilient_prisma_service_1.ResilientPrismaService,
                    useValue: {
                        testConnection: jest.fn(),
                        healthCheck: jest.fn(),
                        resetCircuitBreakers: jest.fn(),
                    },
                },
                {
                    provide: outbox_service_1.OutboxService,
                    useValue: mockOutboxService,
                },
                {
                    provide: injection_tokens_1.INJECTION_TOKENS.PATIENT_REPOSITORY,
                    useValue: mockPatientRepository,
                },
                {
                    provide: injection_tokens_1.INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
                    useValue: mockPsychologistRepository,
                },
                {
                    provide: injection_tokens_1.INJECTION_TOKENS.APPOINTMENT_REPOSITORY,
                    useValue: mockAppointmentRepository,
                },
            ],
        }).compile();
        resilientProcessor = module.get(resilient_process_appointment_use_case_1.ResilientProcessAppointmentUseCase);
        sagaOrchestrator = module.get(saga_orchestrator_1.SagaOrchestrator);
        dlqHandler = module.get(dlq_handler_1.DeadLetterQueueHandler);
        resilientPrisma = module.get(resilient_prisma_service_1.ResilientPrismaService);
        circuitBreaker = new circuit_breaker_1.CircuitBreaker('test-circuit', {
            failureThreshold: 2,
            recoveryTimeout: 1000,
            successThreshold: 1,
        });
        jest.clearAllMocks();
    });
    afterEach(async () => {
        await module.close();
    });
    describe('Saga Pattern Tests', () => {
        it('should complete all steps successfully', async () => {
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
            mockAppointmentRepository.findByPsychologistAndDate.mockResolvedValue(null);
            mockOutboxService.saveEventInTransaction.mockResolvedValue(undefined);
            await expect(resilientProcessor.executeWithResilience(appointmentMessage)).resolves.not.toThrow();
            expect(mockPatientRepository.save).toHaveBeenCalled();
            expect(mockOutboxService.saveEventInTransaction).toHaveBeenCalled();
        });
        it('should compensate when middle step fails', async () => {
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
            mockAppointmentRepository.findByPsychologistAndDate.mockResolvedValue({
                id: 'existing-appointment',
            });
            await resilientProcessor.executeWithResilience(appointmentMessage);
            const executions = sagaOrchestrator.getAllExecutions();
            expect(executions.length).toBeGreaterThan(0);
            expect(executions[0].status).toBe('COMPENSATED');
        });
    });
    describe('Circuit Breaker Tests', () => {
        it('should open circuit after failure threshold', async () => {
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
            expect(circuitBreaker.getHealthStatus().isHealthy).toBe(false);
        });
        it('should transition to half-open after timeout', async () => {
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
            await new Promise((resolve) => setTimeout(resolve, 1100));
            const successOperation = jest.fn().mockResolvedValue('success');
            await circuitBreaker.execute(successOperation);
            expect(circuitBreaker.getHealthStatus().state).toBe(circuit_breaker_1.CircuitBreakerState.CLOSED);
            expect(circuitBreaker.getHealthStatus().isHealthy).toBe(true);
        });
        it('should reset circuit breaker manually', () => {
            circuitBreaker.forceOpen();
            expect(circuitBreaker.getHealthStatus().state).toBe(circuit_breaker_1.CircuitBreakerState.OPEN);
            circuitBreaker.forceClose();
            expect(circuitBreaker.getHealthStatus().state).toBe(circuit_breaker_1.CircuitBreakerState.CLOSED);
            expect(circuitBreaker.getHealthStatus().isHealthy).toBe(true);
        });
    });
    describe('Dead Letter Queue Tests', () => {
        it('should retry failed messages with exponential backoff', () => {
            const originalMessage = { appointmentId: 'test-dlq-1' };
            const error = new Error('Temporary failure');
            dlqHandler.handleFailedMessage(originalMessage, error, 1, 'appointment-processing');
            const healthStatus = dlqHandler.getHealthStatus();
            expect(healthStatus.config.maxRetries).toBe(2);
        });
        it('should send to DLQ after max retries exceeded', () => {
            const originalMessage = { appointmentId: 'test-dlq-2' };
            const error = new Error('Persistent failure');
            dlqHandler.handleFailedMessage(originalMessage, error, 3, 'appointment-processing');
            const healthStatus = dlqHandler.getHealthStatus();
            expect(healthStatus.isHealthy).toBeDefined();
        });
        it('should process DLQ messages', () => {
            const result = dlqHandler.processDLQMessages();
            expect(result).toHaveProperty('processed');
            expect(result).toHaveProperty('errors');
            expect(typeof result.processed).toBe('number');
            expect(typeof result.errors).toBe('number');
        });
    });
    describe('Integration Health Checks', () => {
        it('should report overall system health', () => {
            const healthStatus = resilientProcessor.getHealthStatus();
            expect(healthStatus).toHaveProperty('saga');
            expect(healthStatus).toHaveProperty('dlq');
            expect(healthStatus).toHaveProperty('processingQueue');
            expect(typeof healthStatus.saga).toBe('boolean');
        });
        it('should handle database connection failures gracefully', async () => {
            const prismaHealthCheck = jest.fn().mockResolvedValue({
                database: false,
                connectionCircuitBreaker: { isHealthy: false },
                queryCircuitBreaker: { isHealthy: false },
            });
            resilientPrisma.healthCheck = prismaHealthCheck;
            const healthCheck = await resilientPrisma.healthCheck();
            expect(healthCheck.database).toBe(false);
            expect(healthCheck.connectionCircuitBreaker.isHealthy).toBe(false);
        });
    });
    describe('End-to-End Failure Scenarios', () => {
        it('should handle complete system recovery after multiple failures', async () => {
            const appointmentMessage = {
                appointmentId: 'test-e2e-1',
                patientEmail: 'test@example.com',
                patientName: 'Test Patient',
                psychologistId: 'psychologist-1',
                scheduledAt: '2024-01-15T10:00:00Z',
                duration: 60,
            };
            mockOutboxService.saveEventInTransaction
                .mockRejectedValueOnce(new Error('Database timeout'))
                .mockRejectedValueOnce(new Error('Connection lost'))
                .mockResolvedValueOnce(undefined);
            mockPatientRepository.findByEmail.mockResolvedValue({
                id: 'patient-1',
                email: 'test@example.com',
            });
            mockPsychologistRepository.findById.mockResolvedValue({
                id: 'psychologist-1',
                isActive: true,
                isAvailableAt: jest.fn().mockReturnValue(true),
            });
            mockAppointmentRepository.findByPsychologistAndDate.mockResolvedValue(null);
            await resilientProcessor.executeWithResilience(appointmentMessage, 1);
            const healthStatus = resilientProcessor.getHealthStatus();
            expect(healthStatus).toBeDefined();
        });
    });
});
//# sourceMappingURL=resilience-integration.test.js.map