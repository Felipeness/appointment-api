import { Injectable, Logger } from '@nestjs/common';
import type { Message } from '@aws-sdk/client-sqs';
import { createHash } from 'crypto';

export interface SQSIdempotencyRecord {
  messageId: string;
  messageGroupId?: string;
  deduplicationId?: string;
  bodyHash: string;
  processedAt: Date;
  expiresAt: Date;
  processingResult: 'success' | 'failure' | 'retry';
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SQSIdempotencyService {
  private readonly logger = new Logger(SQSIdempotencyService.name);
  private readonly processedMessages = new Map<string, SQSIdempotencyRecord>(); // In-memory fallback
  private readonly TTL_SECONDS = 3600 * 24; // 24 hours

  constructor() {
    // Setup cleanup interval
    setInterval(() => this.cleanup(), 1000 * 3600); // Every hour
  }

  /**
   * Check if a message has already been processed
   */
  isProcessed(message: Message): boolean {
    const key = this.buildMessageKey(message);

    try {
      const record = this.processedMessages.get(key);

      if (record) {
        // Check if record has expired
        if (record.expiresAt.getTime() < Date.now()) {
          this.processedMessages.delete(key);
          return false;
        }

        this.logger.debug(`Message already processed`, {
          messageId: message.MessageId,
          key,
          result: record.processingResult,
          processedAt: record.processedAt,
        });

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to check if message is processed`, {
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false; // Default to allowing processing
    }
  }

  /**
   * Mark a message as processed
   */
  markAsProcessed(
    message: Message,
    result: 'success' | 'failure' | 'retry',
    metadata?: Record<string, unknown>,
  ): void {
    const key = this.buildMessageKey(message);

    try {
      const record: SQSIdempotencyRecord = {
        messageId: message.MessageId ?? 'unknown',
        messageGroupId: message.Attributes?.MessageGroupId,
        deduplicationId: message.Attributes?.MessageDeduplicationId,
        bodyHash: this.hashMessageBody(message.Body ?? ''),
        processedAt: new Date(),
        expiresAt: new Date(Date.now() + this.TTL_SECONDS * 1000),
        processingResult: result,
        metadata,
      };

      this.processedMessages.set(key, record);

      this.logger.debug(`Marked message as processed`, {
        messageId: message.MessageId,
        key,
        result,
      });
    } catch (error) {
      this.logger.error(`Failed to mark message as processed`, {
        messageId: message.MessageId,
        result,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get processing record for a message
   */
  getProcessingRecord(message: Message): SQSIdempotencyRecord | null {
    const key = this.buildMessageKey(message);

    try {
      const record = this.processedMessages.get(key);

      if (record && record.expiresAt.getTime() >= Date.now()) {
        return record;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get processing record`, {
        messageId: message.MessageId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Generate deduplication ID for FIFO queues
   */
  generateDeduplicationId(
    messageBody: unknown,
    context?: Record<string, unknown>,
  ): string {
    const content =
      typeof messageBody === 'string'
        ? messageBody
        : JSON.stringify(messageBody);
    const contextStr = context
      ? JSON.stringify(context, Object.keys(context).sort())
      : '';

    return createHash('sha256')
      .update(content + contextStr)
      .digest('hex'); // Full SHA-256 hash (64 chars)
  }

  /**
   * Generate message group ID for FIFO queues based on content
   */
  generateMessageGroupId(messageBody: unknown): string {
    // Extract logical grouping from message
    if (
      typeof messageBody === 'object' &&
      messageBody !== null &&
      'patientId' in messageBody
    ) {
      return `patient-${(messageBody as Record<string, unknown>).patientId as string}`;
    }

    if (
      typeof messageBody === 'object' &&
      messageBody !== null &&
      'psychologistId' in messageBody
    ) {
      return `psychologist-${(messageBody as Record<string, unknown>).psychologistId as string}`;
    }

    return 'default-group';
  }

  /**
   * Validate message for duplicate content
   */
  validateMessageUniqueness(message: Message): {
    isUnique: boolean;
    existingRecord?: SQSIdempotencyRecord;
  } {
    const bodyHash = this.hashMessageBody(message.Body ?? '');

    // Check for messages with same content hash
    for (const record of this.processedMessages.values()) {
      if (
        record.bodyHash === bodyHash &&
        record.expiresAt.getTime() >= Date.now()
      ) {
        this.logger.warn(`Detected duplicate message content`, {
          messageId: message.MessageId,
          existingMessageId: record.messageId,
          bodyHash,
        });

        return {
          isUnique: false,
          existingRecord: record,
        };
      }
    }

    return { isUnique: true };
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, record] of this.processedMessages.entries()) {
      if (record.expiresAt.getTime() < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.processedMessages.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.log(
        `Cleaned up ${expiredKeys.length} expired SQS idempotency records`,
      );
    }
  }

  /**
   * Build a unique key for the message
   */
  private buildMessageKey(message: Message): string {
    // Use MessageId as primary key
    if (message.MessageId) {
      return `msg:${message.MessageId}`;
    }

    // Fallback to content-based key
    const bodyHash = this.hashMessageBody(message.Body ?? '');
    return `hash:${bodyHash}`;
  }

  /**
   * Create hash of message body for deduplication
   */
  private hashMessageBody(body: string): string {
    return createHash('sha256').update(body).digest('hex');
  }

  /**
   * Get statistics about processed messages
   */
  getStats(): {
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    retryCount: number;
    oldestRecord?: Date;
    newestRecord?: Date;
  } {
    const records = Array.from(this.processedMessages.values());

    return {
      totalProcessed: records.length,
      successCount: records.filter((r) => r.processingResult === 'success')
        .length,
      failureCount: records.filter((r) => r.processingResult === 'failure')
        .length,
      retryCount: records.filter((r) => r.processingResult === 'retry').length,
      oldestRecord:
        records.length > 0
          ? new Date(Math.min(...records.map((r) => r.processedAt.getTime())))
          : undefined,
      newestRecord:
        records.length > 0
          ? new Date(Math.max(...records.map((r) => r.processedAt.getTime())))
          : undefined,
    };
  }
}
