export interface DomainEvent {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly version: number;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly version: number;

  constructor(aggregateId: string, version: number = 1) {
    this.aggregateId = aggregateId;
    this.eventType = this.constructor.name;
    this.occurredOn = new Date();
    this.version = version;
  }
}
