import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AwsSqsProducer } from '../../messaging/aws-sqs.producer';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface OutboxEvent {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: Record<string, unknown>;
  version?: number;
}

export interface OutboxEventRecord {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  status: string;
  version: number;
  retryCount: number;
  error?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
  maxRetries: number;
}

@Injectable()
export class TransactionalOutboxService {
  private readonly logger = new Logger(TransactionalOutboxService.name);
  private readonly MAX_BATCH_SIZE = 10;
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageProducer: AwsSqsProducer,
  ) {}

  /**
   * Store event in outbox within a transaction
   */
  async storeEvent(event: OutboxEvent, tx?: typeof this.prisma): Promise<void> {
    const prismaClient = tx || this.prisma;

    await prismaClient.outboxEvent.create({
      data: {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        eventData: event.eventData as any,
        status: 'PENDING',
        version: event.version || 1,
      },
    });

    this.logger.log(
      `Event stored in outbox: ${event.eventType} for ${event.aggregateId}`,
    );
  }

  /**
   * Store multiple events in outbox within a transaction
   */
  async storeEvents(
    events: OutboxEvent[],
    tx?: typeof this.prisma,
  ): Promise<void> {
    const prismaClient = tx || this.prisma;

    await prismaClient.outboxEvent.createMany({
      data: events.map((event) => ({
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        eventData: event.eventData as any,
        status: 'PENDING',
        version: event.version || 1,
      })),
    });

    this.logger.log(`${events.length} events stored in outbox`);
  }

  /**
   * Process pending events from outbox (runs as cron job)
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutboxEvents(): Promise<void> {
    try {
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: {
          status: 'PENDING',
          retryCount: { lt: this.MAX_RETRIES },
        },
        orderBy: { createdAt: 'asc' },
        take: this.MAX_BATCH_SIZE,
      });

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingEvents.length} outbox events`);

      for (const event of pendingEvents) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error('Error processing outbox events:', error);
    }
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(event: any): Promise<void> {
    try {
      // Mark as processing
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSING',
          retryCount: event.retryCount + 1,
        },
      });

      // Publish to message queue
      await this.messageProducer.sendMessage({
        ...event.eventData,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        version: event.version,
        occurredAt: event.createdAt.toISOString(),
      } as Record<string, unknown>);

      // Mark as processed
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      this.logger.log(
        `Event processed: ${event.eventType} for ${event.aggregateId}`,
      );
    } catch (error) {
      await this.handleEventError(event, error);
    }
  }

  /**
   * Handle event processing errors
   */
  private async handleEventError(
    event: OutboxEventRecord,
    error: unknown,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (event.retryCount >= this.MAX_RETRIES) {
      // Max retries reached, mark as failed
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      this.logger.error(
        `Event failed after max retries: ${event.eventType} - ${errorMessage}`,
      );
    } else {
      // Reset to pending for retry with exponential backoff
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PENDING',
          error: errorMessage,
        },
      });

      this.logger.warn(
        `Event retry ${event.retryCount}/${this.MAX_RETRIES}: ${event.eventType} - ${errorMessage}`,
      );
    }
  }

  /**
   * Get outbox statistics
   */
  async getOutboxStats(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
  }> {
    const stats = await this.prisma.outboxEvent.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const result = {
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      const status = stat.status.toLowerCase() as keyof typeof result;
      if (status in result) {
        result[status] = stat._count.status;
      }
    });

    return result;
  }

  /**
   * Cleanup old processed events (run daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldEvents(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days

      const deleted = await this.prisma.outboxEvent.deleteMany({
        where: {
          status: 'PROCESSED',
          processedAt: { lt: cutoffDate },
        },
      });

      this.logger.log(`Cleaned up ${deleted.count} old outbox events`);
    } catch (error) {
      this.logger.error('Error cleaning up old events:', error);
    }
  }
}
