import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker } from './circuit-breaker';

export interface DLQMessage {
  id: string;
  originalMessage: any;
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

  async handleFailedMessage(
    originalMessage: any,
    error: Error,
    attemptCount: number,
    originalQueue: string
  ): Promise<void> {
    const dlqMessage: DLQMessage = {
      id: this.generateId(),
      originalMessage,
      failureReason: error.message,
      attemptCount,
      firstFailedAt: attemptCount === 1 ? new Date() : this.extractFirstFailedAt(originalMessage),
      lastFailedAt: new Date(),
      originalQueue,
    };

    this.logger.error(
      `Message failed after ${attemptCount} attempts: ${error.message}`,
      { messageId: dlqMessage.id, originalQueue, error: error.stack }
    );

    if (attemptCount >= this.config.maxRetries) {
      await this.sendToDLQ(dlqMessage);
    } else {
      await this.scheduleRetry(dlqMessage);
    }
  }

  private async sendToDLQ(message: DLQMessage): Promise<void> {
    try {
      this.logger.warn(
        `Sending message to DLQ after ${message.attemptCount} failed attempts`,
        { messageId: message.id, originalQueue: message.originalQueue }
      );

      // In a real implementation, this would send to AWS SQS DLQ
      // For now, we'll simulate storing in a local DLQ store
      await this.storeDLQMessage(message);

      // Notify monitoring/alerting system
      await this.notifyDLQMessage(message);

    } catch (error) {
      this.logger.error(`Failed to send message to DLQ: ${error.message}`, error.stack);
      // This is critical - if we can't even DLQ, we need manual intervention
      await this.escalateToManualIntervention(message, error);
    }
  }

  private async scheduleRetry(message: DLQMessage): Promise<void> {
    const delay = this.calculateRetryDelay(message.attemptCount);
    
    this.logger.log(
      `Scheduling retry for message in ${delay}ms (attempt ${message.attemptCount + 1})`,
      { messageId: message.id }
    );

    // In production, this would use AWS SQS visibility timeout or delay queues
    setTimeout(async () => {
      await this.retryMessage(message);
    }, delay);
  }

  private async retryMessage(message: DLQMessage): Promise<void> {
    try {
      await this.circuitBreaker.execute(async () => {
        this.logger.log(`Retrying failed message (attempt ${message.attemptCount + 1})`, {
          messageId: message.id
        });

        // In production, this would republish to the original queue
        // For now, we simulate the retry process
        await this.reprocessMessage(message.originalMessage);
      });

      this.logger.log(`Message retry succeeded`, { messageId: message.id });

    } catch (error) {
      await this.handleFailedMessage(
        message.originalMessage,
        error instanceof Error ? error : new Error('Unknown retry error'),
        message.attemptCount + 1,
        message.originalQueue
      );
    }
  }

  async processDLQMessages(): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    this.logger.log('Starting DLQ message processing');

    const dlqMessages = await this.getDLQMessages();
    
    for (const message of dlqMessages) {
      try {
        await this.reprocessDLQMessage(message);
        await this.removeDLQMessage(message.id);
        processed++;
        
        this.logger.log(`Successfully reprocessed DLQ message`, { messageId: message.id });
        
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to reprocess DLQ message: ${error.message}`,
          { messageId: message.id, error: error.stack }
        );

        // Update failure count in DLQ
        await this.updateDLQMessageFailure(message.id, error);
      }
    }

    this.logger.log(`DLQ processing completed: ${processed} processed, ${errors} errors`);
    
    return { processed, errors };
  }

  private calculateRetryDelay(attemptCount: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelayMs;
    }

    const exponentialDelay = this.config.retryDelayMs * Math.pow(2, attemptCount - 1);
    return Math.min(exponentialDelay, this.config.maxRetryDelayMs);
  }

  private extractFirstFailedAt(originalMessage: any): Date {
    // Try to extract from message metadata if available
    return originalMessage.firstFailedAt ? new Date(originalMessage.firstFailedAt) : new Date();
  }

  private generateId(): string {
    return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simulated storage methods - in production these would interact with AWS SQS/DynamoDB
  private async storeDLQMessage(message: DLQMessage): Promise<void> {
    // Store in persistent storage (DynamoDB, Redis, or database)
    this.logger.log(`Stored message in DLQ`, { messageId: message.id });
  }

  private async getDLQMessages(): Promise<DLQMessage[]> {
    // Retrieve from persistent storage
    return [];
  }

  private async removeDLQMessage(messageId: string): Promise<void> {
    // Remove from persistent storage
    this.logger.log(`Removed message from DLQ`, { messageId });
  }

  private async updateDLQMessageFailure(messageId: string, error: Error): Promise<void> {
    // Update failure count and error details
    this.logger.log(`Updated DLQ message failure`, { messageId, error: error.message });
  }

  private async reprocessMessage(originalMessage: any): Promise<void> {
    // Reprocess the original message through the normal pipeline
    this.logger.log('Reprocessing message through normal pipeline');
  }

  private async reprocessDLQMessage(message: DLQMessage): Promise<void> {
    // Reprocess a message from DLQ
    await this.reprocessMessage(message.originalMessage);
  }

  private async notifyDLQMessage(message: DLQMessage): Promise<void> {
    // Send to monitoring/alerting system (CloudWatch, Slack, PagerDuty, etc.)
    this.logger.warn(`DLQ Alert: Message sent to DLQ`, {
      messageId: message.id,
      originalQueue: message.originalQueue,
      failureReason: message.failureReason,
      totalAttempts: message.attemptCount,
    });
  }

  private async escalateToManualIntervention(message: DLQMessage, error: Error): Promise<void> {
    // Critical escalation - even DLQ failed
    this.logger.error('CRITICAL: Failed to DLQ message - manual intervention required', {
      messageId: message.id,
      dlqError: error.message,
      originalError: message.failureReason,
    });
    
    // In production: send to high-priority alerting channel
  }

  // Health check and metrics
  getHealthStatus(): {
    isHealthy: boolean;
    circuitBreakerStatus: any;
    config: DLQConfig;
  } {
    return {
      isHealthy: this.circuitBreaker.getHealthStatus().isHealthy,
      circuitBreakerStatus: this.circuitBreaker.getHealthStatus(),
      config: this.config,
    };
  }
}