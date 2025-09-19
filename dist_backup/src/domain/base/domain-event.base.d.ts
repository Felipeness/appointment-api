export interface DomainEvent {
    readonly aggregateId: string;
    readonly eventType: string;
    readonly occurredOn: Date;
    readonly version: number;
}
export declare abstract class BaseDomainEvent implements DomainEvent {
    readonly aggregateId: string;
    readonly eventType: string;
    readonly occurredOn: Date;
    readonly version: number;
    constructor(aggregateId: string, version?: number);
}
