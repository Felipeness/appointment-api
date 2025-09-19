"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxEventEntity = void 0;
class OutboxEventEntity {
    id;
    aggregateId;
    aggregateType;
    eventType;
    eventData;
    createdAt;
    processedAt;
    retryCount;
    maxRetries;
    status;
    error;
    version;
    constructor(id, aggregateId, aggregateType, eventType, eventData, createdAt = new Date(), processedAt, retryCount = 0, maxRetries = 3, status = 'PENDING', error, version = 1) {
        this.id = id;
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.eventType = eventType;
        this.eventData = eventData;
        this.createdAt = createdAt;
        this.processedAt = processedAt;
        this.retryCount = retryCount;
        this.maxRetries = maxRetries;
        this.status = status;
        this.error = error;
        this.version = version;
    }
    markAsProcessing() {
        return new OutboxEventEntity(this.id, this.aggregateId, this.aggregateType, this.eventType, this.eventData, this.createdAt, undefined, this.retryCount, this.maxRetries, 'PROCESSING', this.error, this.version);
    }
    markAsProcessed() {
        return new OutboxEventEntity(this.id, this.aggregateId, this.aggregateType, this.eventType, this.eventData, this.createdAt, new Date(), this.retryCount, this.maxRetries, 'PROCESSED', this.error, this.version);
    }
    markAsFailed(error) {
        return new OutboxEventEntity(this.id, this.aggregateId, this.aggregateType, this.eventType, this.eventData, this.createdAt, this.processedAt, this.retryCount + 1, this.maxRetries, this.retryCount + 1 >= this.maxRetries ? 'FAILED' : 'PENDING', error, this.version);
    }
    canRetry() {
        return this.retryCount < this.maxRetries && this.status !== 'PROCESSED';
    }
}
exports.OutboxEventEntity = OutboxEventEntity;
//# sourceMappingURL=outbox.entity.js.map