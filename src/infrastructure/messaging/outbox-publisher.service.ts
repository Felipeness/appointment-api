import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { OutboxService } from '../database/outbox/outbox.service';
import { OutboxEventEntity } from '../database/outbox/outbox.entity';
import type { MessageQueue } from '../../application/interfaces/message-queue.interface';
import { INJECTION_TOKENS } from '../../shared/constants/injection-tokens';

@Injectable()
export class OutboxPublisherService implements OnModuleInit {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly outboxService: OutboxService,
    @Inject(INJECTION_TOKENS.MESSAGE_QUEUE)
    private readonly messageQueue: MessageQueue
  ) {}

  onModuleInit() {
    this.startProcessing();
  }

  onModuleDestroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  private startProcessing(): void {
    this.logger.log('Starting outbox event publisher');
    
    // Process outbox events every 5 seconds
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processOutboxEvents();
      }
    }, 5000);

    // Cleanup processed events every hour
    setInterval(async () => {
      await this.cleanupProcessedEvents();
    }, 60 * 60 * 1000);
  }

  private async processOutboxEvents(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      const pendingEvents = await this.outboxService.getPendingEvents(10);

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingEvents.length} outbox events`);

      // Process events in parallel with limited concurrency
      const promises = pendingEvents.map(event => this.processEvent(event));
      await Promise.allSettled(promises);

    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: OutboxEventEntity): Promise<void> {
    try {
      // Mark as processing to prevent other instances from picking it up
      await this.outboxService.markEventAsProcessing(event.id);

      // Publish to message queue
      await this.publishEventToQueue(event);

      // Mark as processed
      await this.outboxService.markEventAsProcessed(event.id);
      
      this.logger.log(`Successfully published outbox event: ${event.eventType} for ${event.aggregateId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(
        `Failed to publish outbox event: ${event.eventType} for ${event.aggregateId}`,
        errorMessage
      );

      // Mark as failed and check if we should retry
      const failedEvent = await this.outboxService.markEventAsFailed(event.id, errorMessage);
      
      if (!failedEvent.canRetry()) {
        this.logger.error(
          `Outbox event exceeded max retries: ${event.eventType} for ${event.aggregateId}`
        );
        // Here you could send to Dead Letter Queue or alert monitoring system
        await this.handleFailedEvent(failedEvent);
      }
    }
  }

  private async publishEventToQueue(event: OutboxEventEntity): Promise<void> {
    // Transform outbox event to message queue format
    const message = {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      metadata: {
        eventId: event.id,
        version: event.version,
        timestamp: event.createdAt.toISOString(),
      },
    };

    await this.messageQueue.sendMessage(message);
  }

  private async handleFailedEvent(event: OutboxEventEntity): Promise<void> {
    // Send to Dead Letter Queue or monitoring system
    this.logger.error(`Sending failed event to DLQ: ${event.eventType} for ${event.aggregateId}`);
    
    // You could implement a Dead Letter Queue publisher here
    // await this.deadLetterQueue.send(event);
    
    // Or send alert to monitoring system
    // await this.alerting.sendAlert('OUTBOX_EVENT_FAILED', event);
  }

  private async cleanupProcessedEvents(): Promise<void> {
    try {
      const deletedCount = await this.outboxService.cleanupProcessedEvents(7); // 7 days retention
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} processed outbox events`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up processed events', error);
    }
  }

  // Manual trigger for testing or operational needs
  async triggerProcessing(): Promise<void> {
    this.logger.log('Manually triggering outbox processing');
    await this.processOutboxEvents();
  }

  // Health check method
  async getHealth(): Promise<{ 
    isProcessing: boolean; 
    pendingEvents: number; 
    lastProcessed: Date 
  }> {
    const pendingEvents = await this.outboxService.getPendingEvents(1);
    
    return {
      isProcessing: this.isProcessing,
      pendingEvents: pendingEvents.length,
      lastProcessed: new Date(),
    };
  }
}