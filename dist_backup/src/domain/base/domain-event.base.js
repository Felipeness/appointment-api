"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDomainEvent = void 0;
class BaseDomainEvent {
    aggregateId;
    eventType;
    occurredOn;
    version;
    constructor(aggregateId, version = 1) {
        this.aggregateId = aggregateId;
        this.eventType = this.constructor.name;
        this.occurredOn = new Date();
        this.version = version;
    }
}
exports.BaseDomainEvent = BaseDomainEvent;
//# sourceMappingURL=domain-event.base.js.map