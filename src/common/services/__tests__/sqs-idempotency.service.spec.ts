/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { SQSIdempotencyService } from '../sqs-idempotency.service';
import type { Message } from '@aws-sdk/client-sqs';

describe('SQSIdempotencyService', () => {
  let service: SQSIdempotencyService;

  const createMockMessage = (messageId: string, body: any): Message => ({
    MessageId: messageId,
    Body: typeof body === 'string' ? body : JSON.stringify(body),
    ReceiptHandle: `receipt-${messageId}`,
    Attributes: {},
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SQSIdempotencyService],
    }).compile();

    service = module.get<SQSIdempotencyService>(SQSIdempotencyService);
  });

  afterEach(() => {
    // Clear in-memory processed messages after each test
    (service as any).processedMessages.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isProcessed and markAsProcessed', () => {
    it('should track processed messages', () => {
      const message = createMockMessage('msg-123', { test: 'data' });

      // Initially not processed
      const initialStatus = service.isProcessed(message);
      expect(initialStatus).toBe(false);

      // Mark as processed
      service.markAsProcessed(message, 'success', {
        processingTime: 100,
      });

      // Now should be processed
      const processedStatus = service.isProcessed(message);
      expect(processedStatus).toBe(true);
    });

    it('should handle different processing results', () => {
      const message1 = createMockMessage('msg-success', { data: 'success' });
      const message2 = createMockMessage('msg-failure', { data: 'failure' });
      const message3 = createMockMessage('msg-retry', { data: 'retry' });

      service.markAsProcessed(message1, 'success');
      service.markAsProcessed(message2, 'failure');
      service.markAsProcessed(message3, 'retry');

      expect(service.isProcessed(message1)).toBe(true);
      expect(service.isProcessed(message2)).toBe(true);
      expect(service.isProcessed(message3)).toBe(true);

      const stats = service.getStats();
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(1);
      expect(stats.retryCount).toBe(1);
    });

    it('should handle expired records', () => {
      const message = createMockMessage('msg-expired', { data: 'test' });

      service.markAsProcessed(message, 'success');

      // Manually expire the record
      const record = (service as any).processedMessages.get('msg:msg-expired');
      record.expiresAt = new Date(Date.now() - 1000); // 1 second ago

      // Should now return false as expired
      const isProcessed = service.isProcessed(message);
      expect(isProcessed).toBe(false);
    });
  });

  describe('getProcessingRecord', () => {
    it('should retrieve processing record with metadata', () => {
      const message = createMockMessage('msg-record', { test: 'data' });
      const metadata = {
        processingTime: 150,
        traceId: 'trace-123',
        customData: 'value',
      };

      service.markAsProcessed(message, 'success', metadata);

      const record = service.getProcessingRecord(message);

      expect(record).toBeDefined();
      expect(record?.messageId).toBe('msg-record');
      expect(record?.processingResult).toBe('success');
      expect(record?.metadata).toEqual(metadata);
    });

    it('should return null for non-existent message', () => {
      const message = createMockMessage('non-existent', { data: 'test' });

      const record = service.getProcessingRecord(message);
      expect(record).toBeNull();
    });

    it('should return null for expired record', () => {
      const message = createMockMessage('expired-record', { data: 'test' });

      service.markAsProcessed(message, 'success');

      // Expire the record
      const storedRecord = (service as any).processedMessages.get(
        'msg:expired-record',
      );
      storedRecord.expiresAt = new Date(Date.now() - 1000);

      const record = service.getProcessingRecord(message);
      expect(record).toBeNull();
    });
  });

  describe('generateDeduplicationId', () => {
    it('should generate consistent deduplication IDs for same content', () => {
      const messageBody = { patientId: 'p1', psychologistId: 'ps1' };
      const context = { priority: 'high' };

      const id1 = service.generateDeduplicationId(messageBody, context);
      const id2 = service.generateDeduplicationId(messageBody, context);

      expect(id1).toBe(id2);
      expect(id1).toHaveLength(64); // SHA-256 full hash (64 chars)
    });

    it('should generate different IDs for different content', () => {
      const messageBody1 = { patientId: 'p1', psychologistId: 'ps1' };
      const messageBody2 = { patientId: 'p2', psychologistId: 'ps1' };

      const id1 = service.generateDeduplicationId(messageBody1);
      const id2 = service.generateDeduplicationId(messageBody2);

      expect(id1).not.toBe(id2);
    });

    it('should handle string message bodies', () => {
      const stringMessage = 'simple string message';

      const id1 = service.generateDeduplicationId(stringMessage);
      const id2 = service.generateDeduplicationId(stringMessage);

      expect(id1).toBe(id2);
    });

    it('should include context in deduplication ID', () => {
      const messageBody = { test: 'data' };
      const context1 = { priority: 'high' };
      const context2 = { priority: 'low' };

      const id1 = service.generateDeduplicationId(messageBody, context1);
      const id2 = service.generateDeduplicationId(messageBody, context2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('generateMessageGroupId', () => {
    it('should generate patient-based group ID', () => {
      const messageBody = { patientId: 'patient-123', data: 'test' };

      const groupId = service.generateMessageGroupId(messageBody);

      expect(groupId).toBe('patient-patient-123');
    });

    it('should generate psychologist-based group ID when no patient', () => {
      const messageBody = { psychologistId: 'psych-456', data: 'test' };

      const groupId = service.generateMessageGroupId(messageBody);

      expect(groupId).toBe('psychologist-psych-456');
    });

    it('should use default group for unrecognized message format', () => {
      const messageBody = { unknownField: 'value' };

      const groupId = service.generateMessageGroupId(messageBody);

      expect(groupId).toBe('default-group');
    });

    it('should prefer patient over psychologist when both present', () => {
      const messageBody = {
        patientId: 'patient-123',
        psychologistId: 'psych-456',
      };

      const groupId = service.generateMessageGroupId(messageBody);

      expect(groupId).toBe('patient-patient-123');
    });
  });

  describe('validateMessageUniqueness', () => {
    it('should detect duplicate content', () => {
      const content = { patientId: 'p1', data: 'same content' };
      const message1 = createMockMessage('msg-1', content);
      const message2 = createMockMessage('msg-2', content); // Same content, different ID

      // Process first message
      service.markAsProcessed(message1, 'success');

      // Check uniqueness of second message
      const validation = service.validateMessageUniqueness(message2);

      expect(validation.isUnique).toBe(false);
      expect(validation.existingRecord).toBeDefined();
      expect(validation.existingRecord?.messageId).toBe('msg-1');
    });

    it('should allow unique content', () => {
      const message1 = createMockMessage('msg-1', { patientId: 'p1' });
      const message2 = createMockMessage('msg-2', { patientId: 'p2' }); // Different content

      service.markAsProcessed(message1, 'success');

      const validation = service.validateMessageUniqueness(message2);

      expect(validation.isUnique).toBe(true);
      expect(validation.existingRecord).toBeUndefined();
    });

    it('should ignore expired records in uniqueness check', () => {
      const content = { data: 'test content' };
      const message1 = createMockMessage('msg-expired', content);
      const message2 = createMockMessage('msg-new', content);

      // Process first message and expire it
      service.markAsProcessed(message1, 'success');
      const record = (service as any).processedMessages.get('msg:msg-expired');
      record.expiresAt = new Date(Date.now() - 1000);

      // Check uniqueness
      const validation = service.validateMessageUniqueness(message2);

      expect(validation.isUnique).toBe(true); // Should be unique since first record expired
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      const messages = [
        createMockMessage('msg-1', { data: 'test1' }),
        createMockMessage('msg-2', { data: 'test2' }),
        createMockMessage('msg-3', { data: 'test3' }),
        createMockMessage('msg-4', { data: 'test4' }),
        createMockMessage('msg-5', { data: 'test5' }),
      ];

      // Mark messages with different results
      service.markAsProcessed(messages[0], 'success');
      service.markAsProcessed(messages[1], 'success');
      service.markAsProcessed(messages[2], 'failure');
      service.markAsProcessed(messages[3], 'retry');
      service.markAsProcessed(messages[4], 'success');

      const stats = service.getStats();

      expect(stats.totalProcessed).toBe(5);
      expect(stats.successCount).toBe(3);
      expect(stats.failureCount).toBe(1);
      expect(stats.retryCount).toBe(1);
      expect(stats.oldestRecord).toBeDefined();
      expect(stats.newestRecord).toBeDefined();
    });

    it('should return zero stats for empty service', () => {
      const stats = service.getStats();

      expect(stats.totalProcessed).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(stats.retryCount).toBe(0);
      expect(stats.oldestRecord).toBeUndefined();
      expect(stats.newestRecord).toBeUndefined();
    });
  });

  describe('buildMessageKey', () => {
    it('should use MessageId when available', () => {
      const message = createMockMessage('test-id-123', { data: 'test' });

      const key = (service as any).buildMessageKey(message);

      expect(key).toBe('msg:test-id-123');
    });

    it('should fallback to content hash when MessageId is missing', () => {
      const message: Message = {
        Body: JSON.stringify({ data: 'test without id' }),
        ReceiptHandle: 'receipt-123',
      };

      const key = (service as any).buildMessageKey(message);

      expect(key.startsWith('hash:')).toBe(true);
      expect(key).toHaveLength(69); // 'hash:' + 64 char SHA-256
    });
  });

  describe('cleanup process', () => {
    it('should manually clean up expired records', () => {
      const message = createMockMessage('cleanup-test', { data: 'test' });

      service.markAsProcessed(message, 'success');

      // Expire the record
      const record = (service as any).processedMessages.get('msg:cleanup-test');
      record.expiresAt = new Date(Date.now() - 1000);

      // Manually trigger cleanup
      (service as any).cleanup();

      const stats = service.getStats();
      expect(stats.totalProcessed).toBe(0); // Should be cleaned up
    });
  });
});
