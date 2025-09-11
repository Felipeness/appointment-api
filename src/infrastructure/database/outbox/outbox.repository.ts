import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OutboxEventEntity } from './outbox.entity';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(event: OutboxEventEntity): Promise<OutboxEventEntity> {
    const saved = await this.prisma.outboxEvent.create({
      data: {
        id: event.id,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        eventData: JSON.stringify(event.eventData),
        createdAt: event.createdAt,
        processedAt: event.processedAt,
        retryCount: event.retryCount,
        maxRetries: event.maxRetries,
        status: event.status,
        error: event.error,
        version: event.version,
      },
    });

    return this.toDomain(saved);
  }

  async update(event: OutboxEventEntity): Promise<OutboxEventEntity> {
    const updated = await this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        processedAt: event.processedAt,
        retryCount: event.retryCount,
        status: event.status,
        error: event.error,
      },
    });

    return this.toDomain(updated);
  }

  async findPendingEvents(limit: number = 10): Promise<OutboxEventEntity[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
        retryCount: {
          lt: this.prisma.outboxEvent.fields.maxRetries,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return events.map(this.toDomain);
  }

  async findByAggregateId(aggregateId: string): Promise<OutboxEventEntity[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { aggregateId },
      orderBy: { createdAt: 'asc' },
    });

    return events.map(this.toDomain);
  }

  async deleteProcessedEvents(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.outboxEvent.deleteMany({
      where: {
        status: 'PROCESSED',
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  private toDomain(event: any): OutboxEventEntity {
    return new OutboxEventEntity(
      event.id,
      event.aggregateId,
      event.aggregateType,
      event.eventType,
      JSON.parse(event.eventData),
      event.createdAt,
      event.processedAt,
      event.retryCount,
      event.maxRetries,
      event.status,
      event.error,
      event.version
    );
  }
}