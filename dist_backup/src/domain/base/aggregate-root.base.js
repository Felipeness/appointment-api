"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const entity_base_1 = require("./entity.base");
class AggregateRoot extends entity_base_1.Entity {
    _domainEvents = [];
    _version = 0;
    constructor(props, id, version) {
        super(props, id);
        this._version = version ?? 0;
    }
    get version() {
        return this._version;
    }
    get domainEvents() {
        return [...this._domainEvents];
    }
    addDomainEvent(domainEvent) {
        this._domainEvents.push(domainEvent);
        this._version++;
    }
    clearDomainEvents() {
        this._domainEvents.splice(0, this._domainEvents.length);
    }
    markEventsAsCommitted() {
        this.clearDomainEvents();
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.base.js.map