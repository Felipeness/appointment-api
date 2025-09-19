export interface OutboxEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: Record<string, unknown>;
  createdAt: Date;
  processedAt?: Date;
  retryCount: number;
  maxRetries: number;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  error?: string;
  version: number;
}

export class OutboxEventEntity implements OutboxEvent {
  constructor(
    public readonly id: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly eventType: string,
    public readonly eventData: Record<string, unknown>,
    public readonly createdAt: Date = new Date(),
    public readonly processedAt?: Date,
    public readonly retryCount: number = 0,
    public readonly maxRetries: number = 3,
    public readonly status:
      | 'PENDING'
      | 'PROCESSING'
      | 'PROCESSED'
      | 'FAILED' = 'PENDING',
    public readonly error?: string,
    public readonly version: number = 1,
  ) {}

  public markAsProcessing(): OutboxEventEntity {
    return new OutboxEventEntity(
      this.id,
      this.aggregateId,
      this.aggregateType,
      this.eventType,
      this.eventData,
      this.createdAt,
      undefined,
      this.retryCount,
      this.maxRetries,
      'PROCESSING',
      this.error,
      this.version,
    );
  }

  public markAsProcessed(): OutboxEventEntity {
    return new OutboxEventEntity(
      this.id,
      this.aggregateId,
      this.aggregateType,
      this.eventType,
      this.eventData,
      this.createdAt,
      new Date(),
      this.retryCount,
      this.maxRetries,
      'PROCESSED',
      this.error,
      this.version,
    );
  }

  public markAsFailed(error: string): OutboxEventEntity {
    return new OutboxEventEntity(
      this.id,
      this.aggregateId,
      this.aggregateType,
      this.eventType,
      this.eventData,
      this.createdAt,
      this.processedAt,
      this.retryCount + 1,
      this.maxRetries,
      this.retryCount + 1 >= this.maxRetries ? 'FAILED' : 'PENDING',
      error,
      this.version,
    );
  }

  public canRetry(): boolean {
    return this.retryCount < this.maxRetries && this.status !== 'PROCESSED';
  }
}
