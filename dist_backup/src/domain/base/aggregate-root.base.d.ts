import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';
export declare abstract class AggregateRoot<T = unknown> extends Entity<T> {
    private _domainEvents;
    private _version;
    constructor(props: T, id?: string, version?: number);
    get version(): number;
    get domainEvents(): DomainEvent[];
    protected addDomainEvent(domainEvent: DomainEvent): void;
    clearDomainEvents(): void;
    markEventsAsCommitted(): void;
}
