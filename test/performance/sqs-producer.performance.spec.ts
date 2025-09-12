/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Test, TestingModule } from '@nestjs/testing';
import { performance } from 'perf_hooks';
import { EnterpriseAppointmentProducer } from '../../src/infrastructure/messaging/enterprise-appointment.producer';
import { CircuitBreaker } from '../../src/common/resilience/circuit-breaker';
import { SQSClient } from '@aws-sdk/client-sqs';
import { CreateAppointmentDto } from '../../src/application/dtos/create-appointment.dto';

describe('SQS Producer Performance Tests', () => {
  let producer: EnterpriseAppointmentProducer;
  let module: TestingModule;
  let mockSQSClient: jest.Mocked<SQSClient>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;

  beforeAll(async () => {
    mockSQSClient = {
      send: jest.fn().mockResolvedValue({}),
    } as any;

    mockCircuitBreaker = {
      execute: jest.fn().mockImplementation((fn: any) => fn()),
    } as any;

    module = await Test.createTestingModule({
      providers: [
        EnterpriseAppointmentProducer,
        {
          provide: SQSClient,
          useValue: mockSQSClient,
        },
        {
          provide: CircuitBreaker,
          useValue: mockCircuitBreaker,
        },
      ],
    }).compile();

    producer = module.get<EnterpriseAppointmentProducer>(
      EnterpriseAppointmentProducer,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockAppointment = (id: number): CreateAppointmentDto => ({
    patientId: `patient-${id}`,
    psychologistId: `psych-${id}`,
    startDateTime: new Date('2024-02-01T10:00:00Z'),
    duration: 60,
    type: 'consultation',
  });

  describe('Single Message Performance', () => {
    it('should send single message within acceptable time (< 100ms)', async () => {
      const message = createMockAppointment(1);
      const startTime = performance.now();

      await producer.sendMessage(message);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(mockSQSClient.send).toHaveBeenCalledTimes(1);
    });

    it('should handle 100 sequential messages efficiently (< 5s total)', async () => {
      const messageCount = 100;
      const messages = Array.from({ length: messageCount }, (_, i) =>
        createMockAppointment(i),
      );

      const startTime = performance.now();

      for (const message of messages) {
        await producer.sendMessage(message);
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / messageCount;

      expect(totalDuration).toBeLessThan(5000);
      expect(avgDuration).toBeLessThan(50);
      expect(mockSQSClient.send).toHaveBeenCalledTimes(messageCount);
    });
  });

  describe('Batch Performance', () => {
    it('should handle batch of 10 messages efficiently', async () => {
      const batchSize = 10;
      const messages = Array.from({ length: batchSize }, (_, i) =>
        createMockAppointment(i),
      );

      const startTime = performance.now();

      const promises = messages.map((message) => producer.sendMessage(message));
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
      expect(mockSQSClient.send).toHaveBeenCalledTimes(batchSize);
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentBatches = 5;
      const batchSize = 20;

      const startTime = performance.now();

      const batchPromises = Array.from({ length: concurrentBatches }, () => {
        const messages = Array.from({ length: batchSize }, (_, i) =>
          createMockAppointment(i),
        );
        return Promise.all(messages.map((msg) => producer.sendMessage(msg)));
      });

      await Promise.all(batchPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000);
      expect(mockSQSClient.send).toHaveBeenCalledTimes(
        concurrentBatches * batchSize,
      );
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during high-volume operations', async () => {
      const initialMemory = process.memoryUsage();

      const messageCount = 1000;
      const messages = Array.from({ length: messageCount }, (_, i) =>
        createMockAppointment(i),
      );

      for (const message of messages) {
        await producer.sendMessage(message);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (< 10MB for 1000 messages)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Circuit Breaker Performance', () => {
    it('should handle circuit breaker failures gracefully', async () => {
      mockCircuitBreaker.execute.mockRejectedValueOnce(
        new Error('Circuit breaker open'),
      );

      const message = createMockAppointment(1);
      const startTime = performance.now();

      await expect(producer.sendMessage(message)).rejects.toThrow(
        'Circuit breaker open',
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should fail fast when circuit breaker is open
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should handle SQS errors without significant delay', async () => {
      mockSQSClient.send.mockRejectedValueOnce(
        new Error('SQS service unavailable'),
      );

      const message = createMockAppointment(1);
      const startTime = performance.now();

      await expect(producer.sendMessage(message)).rejects.toThrow();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });
});
