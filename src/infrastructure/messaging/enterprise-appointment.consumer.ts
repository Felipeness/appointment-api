import { Injectable, Logger } from '@nestjs/common';
import { SqsMessageHandler, SqsConsumerEventHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';
import { ResilientProcessAppointmentUseCase } from '../../application/use-cases/resilient-process-appointment.use-case';
import { DeadLetterQueueHandler } from '../../common/resilience/dlq-handler';
import { EnterpriseMessage } from './aws-sqs.producer';
import {
  ProcessAppointmentUseCase,
  AppointmentMessage,
} from '../../application/use-cases/process-appointment.use-case';
import { SQSIdempotencyService } from '../../common/services/sqs-idempotency.service';

@Injectable()
export class EnterpriseAppointmentConsumer {
  private readonly logger = new Logger(EnterpriseAppointmentConsumer.name);

  constructor(
    private readonly resilientProcessor: ResilientProcessAppointmentUseCase,
    private readonly processAppointmentUseCase: ProcessAppointmentUseCase,
    private readonly dlqHandler: DeadLetterQueueHandler,
    private readonly sqsIdempotencyService: SQSIdempotencyService,
  ) {}

  @SqsMessageHandler('appointment-consumer', false)
  async handleAppointmentMessage(message: Message): Promise<void> {
    const startTime = Date.now();
    let parsedMessage: EnterpriseMessage | AppointmentMessage;
    let traceId: string;
    let messageType: string;

    try {
      // Check for duplicate message processing (idempotency)
      const isAlreadyProcessed =
        this.sqsIdempotencyService.isProcessed(message);
      if (isAlreadyProcessed) {
        const record = this.sqsIdempotencyService.getProcessingRecord(message);
        this.logger.log(`Skipping already processed message`, {
          messageId: message.MessageId,
          previousResult: record?.processingResult,
          processedAt: record?.processedAt,
        });
        return;
      }

      // Validate message uniqueness
      const uniqueness =
        this.sqsIdempotencyService.validateMessageUniqueness(message);
      if (!uniqueness.isUnique) {
        this.logger.warn(`Detected duplicate message content, skipping`, {
          messageId: message.MessageId,
          existingMessageId: uniqueness.existingRecord?.messageId,
        });
        this.sqsIdempotencyService.markAsProcessed(message, 'success', {
          reason: 'duplicate_content',
          existingMessageId: uniqueness.existingRecord?.messageId,
        });
        return;
      }

      // Parse message body
      parsedMessage = JSON.parse(message.Body ?? '{}') as
        | EnterpriseMessage
        | AppointmentMessage;

      // Extract metadata for logging and tracing
      traceId = this.extractTraceId(message);
      messageType = this.extractMessageType(message);

      this.logger.log(`Processing message`, {
        messageId: message.MessageId,
        traceId,
        messageType,
        receiptHandle: message.ReceiptHandle?.substring(0, 20) + '...',
      });

      // Route to appropriate processor based on message format
      if (this.isEnterpriseMessage(parsedMessage)) {
        await this.processEnterpriseMessage(parsedMessage, traceId);
      } else {
        // Backward compatibility with legacy messages
        await this.processLegacyMessage(parsedMessage, traceId);
      }

      const processingTime = Date.now() - startTime;

      // Mark message as successfully processed
      this.sqsIdempotencyService.markAsProcessed(message, 'success', {
        processingTimeMs: processingTime,
        traceId,
        messageType,
      });

      this.logger.log(`Message processed successfully`, {
        messageId: message.MessageId,
        traceId,
        processingTimeMs: processingTime,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Mark message as failed for idempotency tracking
      this.sqsIdempotencyService.markAsProcessed(message, 'failure', {
        processingTimeMs: processingTime,
        traceId: traceId!,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
      });

      this.logger.error(`Message processing failed`, {
        messageId: message.MessageId,
        traceId: traceId!,
        error: (error as Error).message,
        processingTimeMs: processingTime,
        stack: (error as Error).stack,
      });

      // Let the SQS consumer handle retries automatically
      throw error;
    }
  }

  private async processEnterpriseMessage(
    message: EnterpriseMessage,
    traceId: string,
  ): Promise<void> {
    // Update retry count for monitoring
    const retryCount = (message.retryCount ?? 0) + 1;
    message.retryCount = retryCount;

    this.logger.debug(`Processing enterprise message`, {
      messageId: message.id,
      messageType: message.type,
      version: message.version,
      retryCount,
      traceId,
    });

    // Route based on message type
    switch (message.type) {
      case 'appointment.requested':
      case 'appointment.confirmed':
      case 'appointment.cancelled':
        await this.resilientProcessor.executeWithResilience(
          message.data as unknown as AppointmentMessage,
          retryCount,
        );
        break;

      default:
        this.logger.warn(`Unknown enterprise message type: ${message.type}`, {
          messageId: message.id,
          traceId,
        });
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private async processLegacyMessage(
    message: AppointmentMessage,
    traceId: string,
  ): Promise<void> {
    this.logger.debug(`Processing legacy message format`, {
      appointmentId: message.appointmentId,
      traceId,
    });

    // Use the resilient processor for better error handling
    await this.resilientProcessor.executeWithResilience(message, 1);
  }

  @SqsConsumerEventHandler('appointment-consumer', 'processing_error')
  public onProcessingError(error: Error, message: Message): void {
    const messageId = message.MessageId;
    const traceId = this.extractTraceId(message);

    this.logger.error(`SQS message processing error`, {
      messageId,
      traceId,
      error: error.message,
      messageBody: message.Body?.substring(0, 200) + '...',
      stack: error.stack,
    });

    // Try to parse the message for DLQ handling
    try {
      const parsedMessage = JSON.parse(message.Body ?? '{}') as Record<
        string,
        unknown
      >;
      const attemptCount = this.getAttemptCount(message);

      // Send to our DLQ handler for additional processing
      this.dlqHandler.handleFailedMessage(
        parsedMessage,
        error,
        attemptCount,
        'appointment-processing',
      );
    } catch (parseError) {
      this.logger.error(`Failed to parse message for DLQ processing`, {
        messageId,
        traceId,
        parseError: (parseError as Error).message,
      });
    }
  }

  @SqsConsumerEventHandler('appointment-consumer', 'error')
  public onError(error: Error, message?: Message): void {
    this.logger.error(`SQS consumer error`, {
      error: error.message,
      messageId: message?.MessageId,
      stack: error.stack,
    });

    // This could be a connection error, circuit breaker should handle it
    // Log for monitoring and alerting
  }

  @SqsConsumerEventHandler('appointment-consumer', 'timeout_error')
  public onTimeoutError(error: Error, message: Message): void {
    const traceId = this.extractTraceId(message);

    this.logger.error(`Message processing timeout`, {
      messageId: message.MessageId,
      traceId,
      error: error.message,
      visibilityTimeout: 'Message will return to queue for retry',
    });
  }

  @SqsConsumerEventHandler('appointment-consumer', 'message_received')
  public onMessageReceived(message: Message): void {
    const messageType = this.extractMessageType(message);
    const traceId = this.extractTraceId(message);

    this.logger.debug(`Message received`, {
      messageId: message.MessageId,
      messageType,
      traceId,
      receivedAt: new Date().toISOString(),
    });
  }

  @SqsConsumerEventHandler('appointment-consumer', 'message_processed')
  public onMessageProcessed(message: Message): void {
    const traceId = this.extractTraceId(message);

    this.logger.debug(`Message processed and deleted`, {
      messageId: message.MessageId,
      traceId,
      processedAt: new Date().toISOString(),
    });
  }

  // Utility methods
  private extractTraceId(message: Message): string {
    const traceId =
      message.MessageAttributes?.traceId?.StringValue ??
      message.MessageAttributes?.TraceId?.StringValue;
    return traceId ?? `generated_${message.MessageId}`;
  }

  private extractMessageType(message: Message): string {
    return (
      message.MessageAttributes?.messageType?.StringValue ??
      message.MessageAttributes?.MessageType?.StringValue ??
      'unknown'
    );
  }

  private isEnterpriseMessage(
    message: EnterpriseMessage | AppointmentMessage,
  ): message is EnterpriseMessage {
    return Boolean(
      (
        message as {
          id?: unknown;
          type?: unknown;
          version?: unknown;
          timestamp?: unknown;
        }
      ).id &&
        (
          message as {
            id?: unknown;
            type?: unknown;
            version?: unknown;
            timestamp?: unknown;
          }
        ).type &&
        (
          message as {
            id?: unknown;
            type?: unknown;
            version?: unknown;
            timestamp?: unknown;
          }
        ).version &&
        (
          message as {
            id?: unknown;
            type?: unknown;
            version?: unknown;
            timestamp?: unknown;
          }
        ).timestamp,
    );
  }

  private getAttemptCount(message: Message): number {
    // AWS SQS provides ApproximateReceiveCount attribute
    const receiveCount = message.Attributes?.ApproximateReceiveCount;
    return receiveCount ? parseInt(receiveCount, 10) : 1;
  }

  // Health check method
  getConsumerStatus(): {
    isHealthy: boolean;
    lastProcessedAt?: string;
    messagesProcessed: number;
    errors: number;
  } {
    return {
      isHealthy: true, // Would track actual health
      lastProcessedAt: new Date().toISOString(),
      messagesProcessed: 0, // Would track in production
      errors: 0, // Would track in production
    };
  }
}
