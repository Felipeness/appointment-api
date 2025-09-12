import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker } from './circuit-breaker';

export interface DLQMessage {
  id: string;
  originalMessage: Record<string, unknown>;
  failureReason: string;
  attemptCount: number;
  firstFailedAt: Date;
  lastFailedAt: Date;
  originalQueue: string;
}

export interface DLQConfig {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  maxRetryDelayMs: number;
}

@Injectable()
export class DeadLetterQueueHandler {
  private readonly logger = new Logger(DeadLetterQueueHandler.name);
  private readonly circuitBreaker: CircuitBreaker;

  private readonly config: DLQConfig = {
    maxRetries: 3,
    retryDelayMs: 5000,
    exponentialBackoff: true,
    maxRetryDelayMs: 60000,
  };

  constructor() {
    this.circuitBreaker = new CircuitBreaker('dlq-processor', {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
      successThreshold: 3,
    });
  }

  handleFailedMessage(
    originalMessage: Record<string, unknown>,
    error: Error,
    attemptCount: number,
    originalQueue: string,
  ): void {
    const dlqMessage: DLQMessage = {
      id: this.generateId(),
      originalMessage,
      failureReason: error.message,
      attemptCount,
      firstFailedAt:
        attemptCount === 1
          ? new Date()
          : this.extractFirstFailedAt(originalMessage),
      lastFailedAt: new Date(),
      originalQueue,
    };

    this.logger.error(
      `Message failed after ${attemptCount} attempts: ${error.message}`,
      { messageId: dlqMessage.id, originalQueue, error: error.stack },
    );

    if (attemptCount >= this.config.maxRetries) {
      this.sendToDLQ(dlqMessage);
    } else {
      this.scheduleRetry(dlqMessage);
    }
  }

  private sendToDLQ(message: DLQMessage): void {
    try {
      this.logger.warn(
        `Sending message to DLQ after ${message.attemptCount} failed attempts`,
        { messageId: message.id, originalQueue: message.originalQueue },
      );

      // In a real implementation, this would send to AWS SQS DLQ
      // For now, we'll simulate storing in a local DLQ store
      this.storeDLQMessage(message);

      // Notify monitoring/alerting system
      this.notifyDLQMessage(message);
    } catch (error) {
      this.logger.error(
        `Failed to send message to DLQ: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // This is critical - if we can't even DLQ, we need manual intervention
      this.escalateToManualIntervention(
        message,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private scheduleRetry(message: DLQMessage): void {
    const delay = this.calculateRetryDelay(message.attemptCount);

    this.logger.log(
      `Scheduling retry for message in ${delay}ms (attempt ${message.attemptCount + 1})`,
      { messageId: message.id },
    );

    // In production, this would use AWS SQS visibility timeout or delay queues
    setTimeout(() => {
      void this.retryMessage(message);
    }, delay);
  }

  private async retryMessage(message: DLQMessage): Promise<void> {
    try {
      await this.circuitBreaker.execute(async () => {
        this.logger.log(
          `Retrying failed message (attempt ${message.attemptCount + 1})`,
          {
            messageId: message.id,
          },
        );

        // In production, this would republish to the original queue
        // For now, we simulate the retry process
        this.reprocessMessage(message.originalMessage);
        return Promise.resolve();
      });

      this.logger.log(`Message retry succeeded`, { messageId: message.id });
    } catch (error) {
      this.handleFailedMessage(
        message.originalMessage,
        error instanceof Error ? error : new Error('Unknown retry error'),
        message.attemptCount + 1,
        message.originalQueue,
      );
    }
  }

  processDLQMessages(): { processed: number; errors: number } {
    let processed = 0;
    let errors = 0;

    this.logger.log('Starting DLQ message processing');

    const dlqMessages = this.getDLQMessages();

    for (const message of dlqMessages) {
      try {
        this.reprocessDLQMessage(message);
        this.removeDLQMessage(message.id);
        processed++;

        this.logger.log(`Successfully reprocessed DLQ message`, {
          messageId: message.id,
        });
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to reprocess DLQ message: ${error instanceof Error ? error.message : String(error)}`,
          {
            messageId: message.id,
            error: error instanceof Error ? error.stack : undefined,
          },
        );

        // Update failure count in DLQ
        this.updateDLQMessageFailure(
          message.id,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    this.logger.log(
      `DLQ processing completed: ${processed} processed, ${errors} errors`,
    );

    return { processed, errors };
  }

  private calculateRetryDelay(attemptCount: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelayMs;
    }

    const exponentialDelay =
      this.config.retryDelayMs * Math.pow(2, attemptCount - 1);
    return Math.min(exponentialDelay, this.config.maxRetryDelayMs);
  }

  private extractFirstFailedAt(originalMessage: Record<string, unknown>): Date {
    // Try to extract from message metadata if available
    const firstFailedAt = originalMessage.firstFailedAt;
    return firstFailedAt &&
      (typeof firstFailedAt === 'string' ||
        typeof firstFailedAt === 'number' ||
        firstFailedAt instanceof Date)
      ? new Date(firstFailedAt)
      : new Date();
  }

  private generateId(): string {
    return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simulated storage methods - in production these would interact with AWS SQS/DynamoDB
  private storeDLQMessage(message: DLQMessage): void {
    // Store in persistent storage (DynamoDB, Redis, or database)
    this.logger.log(`Stored message in DLQ`, { messageId: message.id });
  }

  private getDLQMessages(): DLQMessage[] {
    // Retrieve from persistent storage
    return [];
  }

  private removeDLQMessage(messageId: string): void {
    // Remove from persistent storage
    this.logger.log(`Removed message from DLQ`, { messageId });
  }

  private updateDLQMessageFailure(messageId: string, error: Error): void {
    // Update failure count and error details
    this.logger.log(`Updated DLQ message failure`, {
      messageId,
      error: error.message,
    });
  }

  private reprocessMessage(originalMessage: Record<string, unknown>): void {
    // Reprocess the original message through the normal pipeline
    this.logger.log('Reprocessing message through normal pipeline', {
      originalMessage,
    });
  }

  private reprocessDLQMessage(message: DLQMessage): void {
    // Reprocess a message from DLQ
    this.reprocessMessage(message.originalMessage);
  }

  private notifyDLQMessage(message: DLQMessage): void {
    // Send to monitoring/alerting system (CloudWatch, Slack, PagerDuty, etc.)
    this.logger.warn(`DLQ Alert: Message sent to DLQ`, {
      messageId: message.id,
      originalQueue: message.originalQueue,
      failureReason: message.failureReason,
      totalAttempts: message.attemptCount,
    });
  }

  private escalateToManualIntervention(
    message: DLQMessage,
    error: Error,
  ): void {
    // Critical escalation - even DLQ failed
    this.logger.error(
      'CRITICAL: Failed to DLQ message - manual intervention required',
      {
        messageId: message.id,
        dlqError: error.message,
        originalError: message.failureReason,
      },
    );

    // In production: send to high-priority alerting channel
  }

  // Health check and metrics
  getHealthStatus(): {
    isHealthy: boolean;
    circuitBreakerStatus: Record<string, unknown>;
    config: DLQConfig;
  } {
    return {
      isHealthy: this.circuitBreaker.getHealthStatus().isHealthy,
      circuitBreakerStatus: this.circuitBreaker.getHealthStatus(),
      config: this.config,
    };
  }
}
