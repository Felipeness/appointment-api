/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { RedisIdempotencyService } from '../idempotency.service';
import { IdempotencyRecord } from '../interfaces/idempotency.interface';

describe('RedisIdempotencyService', () => {
  let service: RedisIdempotencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisIdempotencyService],
    }).compile();

    service = module.get<RedisIdempotencyService>(RedisIdempotencyService);
  });

  afterEach(() => {
    // Clear in-memory cache after each test
    (service as any).cache.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('store and get', () => {
    it('should store and retrieve idempotency record', () => {
      const record: IdempotencyRecord = {
        key: 'test-key-123',
        userId: 'user-123',
        endpoint: 'POST:/appointments',
        method: 'POST',
        parameters: { patientId: 'p1', psychologistId: 'ps1' },
        response: {
          statusCode: 202,
          body: { appointmentId: 'apt-123', status: 'queued' },
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };

      service.store(record);

      const retrieved = service.get(
        'test-key-123',
        'user-123',
        'POST:/appointments',
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.key).toBe(record.key);
      expect(retrieved?.userId).toBe(record.userId);
      expect(retrieved?.response.statusCode).toBe(202);
      expect(retrieved?.response.body).toEqual(record.response.body);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return null for expired record', () => {
      const record: IdempotencyRecord = {
        key: 'expired-key',
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      service.store(record);

      const result = service.get('expired-key');
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing key', () => {
      const record: IdempotencyRecord = {
        key: 'exists-test',
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      service.store(record);

      const exists = service.exists('exists-test');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', () => {
      const exists = service.exists('does-not-exist');
      expect(exists).toBe(false);
    });

    it('should return false for expired key', () => {
      const record: IdempotencyRecord = {
        key: 'expired-exists',
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000),
      };

      service.store(record);

      const exists = service.exists('expired-exists');
      expect(exists).toBe(false);
    });
  });

  describe('validateParameters', () => {
    const baseRecord: IdempotencyRecord = {
      key: 'param-test',
      endpoint: 'POST:/test',
      method: 'POST',
      parameters: {
        patientId: 'p1',
        psychologistId: 'ps1',
        data: { priority: 'high' },
      },
      response: { statusCode: 200, body: {} },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    };

    it('should return true for identical parameters', () => {
      service.store(baseRecord);

      const sameParameters = {
        patientId: 'p1',
        psychologistId: 'ps1',
        data: { priority: 'high' },
      };

      const isValid = service.validateParameters('param-test', sameParameters);
      expect(isValid).toBe(true);
    });

    it('should return false for different parameters', () => {
      service.store(baseRecord);

      const differentParameters = {
        patientId: 'p2', // Different patient
        psychologistId: 'ps1',
        data: { priority: 'high' },
      };

      const isValid = service.validateParameters(
        'param-test',
        differentParameters,
      );
      expect(isValid).toBe(false);
    });

    it('should return true for non-existent key (new request)', () => {
      const anyParameters = { test: 'value' };

      const isValid = service.validateParameters('new-key', anyParameters);
      expect(isValid).toBe(true);
    });

    it('should handle parameter order differences', () => {
      service.store(baseRecord);

      // Same parameters, different order
      const reorderedParameters = {
        psychologistId: 'ps1', // Order changed
        patientId: 'p1',
        data: { priority: 'high' },
      };

      const isValid = service.validateParameters(
        'param-test',
        reorderedParameters,
      );
      expect(isValid).toBe(true); // Should be true because hashing normalizes order
    });
  });

  describe('cleanup', () => {
    it('should remove expired records', () => {
      // Add expired record
      const expiredRecord: IdempotencyRecord = {
        key: 'expired-cleanup',
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000),
      };

      // Add valid record
      const validRecord: IdempotencyRecord = {
        key: 'valid-cleanup',
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      service.store(expiredRecord);
      service.store(validRecord);

      // Verify both exist initially
      expect((service as any).cache.size).toBe(2);

      // Run cleanup
      service.cleanup();

      // Verify only valid record remains
      const expiredExists = service.exists('expired-cleanup');
      const validExists = service.exists('valid-cleanup');

      expect(expiredExists).toBe(false);
      expect(validExists).toBe(true);
    });
  });

  describe('cache key building', () => {
    it('should build different keys for different contexts', () => {
      const record1: IdempotencyRecord = {
        key: 'same-key',
        userId: 'user1',
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      const record2: IdempotencyRecord = {
        key: 'same-key',
        userId: 'user2', // Different user
        endpoint: 'POST:/test',
        method: 'POST',
        parameters: {},
        response: { statusCode: 200, body: {} },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      service.store(record1);
      service.store(record2);

      // Both records should be stored separately
      const result1 = service.get('same-key', 'user1', 'POST:/test');
      const result2 = service.get('same-key', 'user2', 'POST:/test');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1?.userId).toBe('user1');
      expect(result2?.userId).toBe('user2');
    });
  });
});
