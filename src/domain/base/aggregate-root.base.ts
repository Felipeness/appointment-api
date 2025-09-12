import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

export abstract class AggregateRoot<T = unknown> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  constructor(props: T, id?: string, version?: number) {
    super(props, id);
    this._version = version ?? 0;
  }

  public get version(): number {
    return this._version;
  }

  public get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
    this._version++;
  }

  public clearDomainEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }

  public markEventsAsCommitted(): void {
    this.clearDomainEvents();
  }
}