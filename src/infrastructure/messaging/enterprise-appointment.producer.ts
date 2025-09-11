import { Injectable, Logger } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { MessageQueue } from '../../application/interfaces/message-queue.interface';
import { CircuitBreaker } from '../../common/resilience/circuit-breaker';
import { SQSIdempotencyService } from '../../common/services/sqs-idempotency.service';

export interface EnterpriseMessage {
  id: string;
  type: string;
  version: string;
  timestamp: string;
  source: string;
  data: any;
  traceId?: string;
  correlationId?: string;
  retryCount?: number;
  priority?: 'high' | 'normal' | 'low';
}

@Injectable()
export class EnterpriseAppointmentProducer implements MessageQueue {
  private readonly logger = new Logger(EnterpriseAppointmentProducer.name);
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private readonly sqsService: SqsService) {
    // Circuit breaker specifically for SQS operations
    this.circuitBreaker = new CircuitBreaker('sqs-producer', {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 3,
    });
  }

  async sendMessage(message: any, options?: {
    delaySeconds?: number;
    messageGroupId?: string;
    deduplicationId?: string;
    priority?: 'high' | 'normal' | 'low';
    traceId?: string;
  }): Promise<void> {
    const enterpriseMessage = this.wrapMessage(message, options);

    await this.circuitBreaker.execute(async () => {
      try {
        await this.sqsService.send('appointment-producer', {
          id: enterpriseMessage.id,
          body: enterpriseMessage,
          groupId: options?.messageGroupId,
          deduplicationId: options?.deduplicationId,
          delaySeconds: options?.delaySeconds,
          messageAttributes: {
            messageType: {
              StringValue: enterpriseMessage.type,
              DataType: 'String',
            },
            version: {
              StringValue: enterpriseMessage.version,
              DataType: 'String',
            },
            priority: {
              StringValue: enterpriseMessage.priority || 'normal',
              DataType: 'String',
            },
            source: {
              StringValue: enterpriseMessage.source,
              DataType: 'String',
            },
            traceId: {
              StringValue: enterpriseMessage.traceId || 'unknown',
              DataType: 'String',
            },
            correlationId: {
              StringValue: enterpriseMessage.correlationId || enterpriseMessage.id,
              DataType: 'String',
            },
            timestamp: {
              StringValue: enterpriseMessage.timestamp,
              DataType: 'String',
            },
          },
        });

        this.logger.log(`Message sent successfully`, {
          messageId: enterpriseMessage.id,
          type: enterpriseMessage.type,
          traceId: enterpriseMessage.traceId,
        });

      } catch (error) {
        this.logger.error('Failed to send message to SQS', {
          error: error.message,
          messageId: enterpriseMessage.id,
          stack: error.stack,
        });
        throw error;
      }
    });
  }

  async sendBatchMessages(messages: any[], options?: {
    messageGroupId?: string;
    priority?: 'high' | 'normal' | 'low';
    traceId?: string;
  }): Promise<void> {
    // AWS SQS supports up to 10 messages per batch
    const batches = this.chunkArray(messages, 10);

    for (const batch of batches) {
      const promises = batch.map(message => 
        this.sendMessage(message, {
          ...options,
          deduplicationId: `${message.appointmentId}-${Date.now()}`,
        })
      );

      await Promise.all(promises);
    }

    this.logger.log(`Sent ${messages.length} messages in ${batches.length} batches`);
  }

  // Legacy interface methods for backward compatibility
  async receiveMessages(maxMessages?: number): Promise<any[]> {
    throw new Error('Use consumer service for receiving messages');
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    throw new Error('Message deletion handled automatically by consumer');
  }

  private wrapMessage(data: any, options?: any): EnterpriseMessage {
    const messageId = this.generateMessageId();
    const timestamp = new Date().toISOString();

    return {
      id: messageId,
      type: this.inferMessageType(data),
      version: '1.0',
      timestamp,
      source: 'appointment-api',
      data,
      traceId: options?.traceId || this.generateTraceId(),
      correlationId: data.appointmentId || messageId,
      retryCount: 0,
      priority: options?.priority || 'normal',
    };
  }

  private inferMessageType(data: any): string {
    // Infer message type from data structure
    if (data.appointmentId) {
      if (data.status === 'cancelled') return 'appointment.cancelled';
      if (data.status === 'confirmed') return 'appointment.confirmed';
      return 'appointment.requested';
    }
    return 'unknown';
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Health check and monitoring
  getHealthStatus(): {
    isHealthy: boolean;
    circuitBreakerStatus: any;
    stats: {
      messagesSent: number;
      lastMessageTime?: string;
    };
  } {
    return {
      isHealthy: this.circuitBreaker.getHealthStatus().isHealthy,
      circuitBreakerStatus: this.circuitBreaker.getHealthStatus(),
      stats: {
        messagesSent: 0, // Would be tracked in production
        lastMessageTime: new Date().toISOString(),
      },
    };
  }

  // Manual circuit breaker control
  resetCircuitBreaker(): void {
    this.circuitBreaker.forceClose();
    this.logger.log('SQS producer circuit breaker reset manually');
  }

  openCircuitBreaker(): void {
    this.circuitBreaker.forceOpen();
    this.logger.warn('SQS producer circuit breaker opened manually');
  }
}