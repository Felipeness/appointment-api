import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OutboxRepository } from './outbox.repository';
import { OutboxEventEntity } from './outbox.entity';
import { PrismaService } from '../prisma.service';

export interface DomainEvent {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Stores event in outbox table within the same transaction as business operation
   * This ensures atomicity - either both succeed or both fail
   */
  async saveEventInTransaction(
    event: DomainEvent,
    businessOperation: (prismaTransaction: any) => Promise<any>,
  ): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      // Execute business operation first
      await businessOperation(prisma);

      // Then save event to outbox - if this fails, business operation is rolled back
      const outboxEvent = new OutboxEventEntity(
        uuidv4(),
        event.aggregateId,
        event.aggregateType,
        event.eventType,
        event.eventData,
      );

      await prisma.outboxEvent.create({
        data: {
          id: outboxEvent.id,
          aggregateId: outboxEvent.aggregateId,
          aggregateType: outboxEvent.aggregateType,
          eventType: outboxEvent.eventType,
          eventData: JSON.stringify(outboxEvent.eventData),
          createdAt: outboxEvent.createdAt,
          retryCount: outboxEvent.retryCount,
          maxRetries: outboxEvent.maxRetries,
          status: outboxEvent.status,
          version: outboxEvent.version,
        },
      });

      this.logger.log(
        `Event stored in outbox: ${event.eventType} for ${event.aggregateId}`,
      );
    });
  }

  /**
   * Alternative method for saving events outside transaction
   * Use only when you're sure the business operation succeeded
   */
  async saveEvent(event: DomainEvent): Promise<OutboxEventEntity> {
    const outboxEvent = new OutboxEventEntity(
      uuidv4(),
      event.aggregateId,
      event.aggregateType,
      event.eventType,
      event.eventData,
    );

    return await this.outboxRepository.save(outboxEvent);
  }

  async markEventAsProcessing(eventId: string): Promise<OutboxEventEntity> {
    const events = await this.outboxRepository.findByAggregateId(eventId);
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      throw new Error(`Outbox event not found: ${eventId}`);
    }

    const processingEvent = event.markAsProcessing();
    return await this.outboxRepository.update(processingEvent);
  }

  async markEventAsProcessed(eventId: string): Promise<OutboxEventEntity> {
    const events = await this.outboxRepository.findByAggregateId(eventId);
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      throw new Error(`Outbox event not found: ${eventId}`);
    }

    const processedEvent = event.markAsProcessed();
    return await this.outboxRepository.update(processedEvent);
  }

  async markEventAsFailed(
    eventId: string,
    error: string,
  ): Promise<OutboxEventEntity> {
    const events = await this.outboxRepository.findByAggregateId(eventId);
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      throw new Error(`Outbox event not found: ${eventId}`);
    }

    const failedEvent = event.markAsFailed(error);
    return await this.outboxRepository.update(failedEvent);
  }

  async getPendingEvents(limit: number = 10): Promise<OutboxEventEntity[]> {
    return await this.outboxRepository.findPendingEvents(limit);
  }

  async cleanupProcessedEvents(olderThanDays: number = 7): Promise<number> {
    const deletedCount =
      await this.outboxRepository.deleteProcessedEvents(olderThanDays);
    this.logger.log(`Cleaned up ${deletedCount} processed outbox events`);
    return deletedCount;
  }
}
