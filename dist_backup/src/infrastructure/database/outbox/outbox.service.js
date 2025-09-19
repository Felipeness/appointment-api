"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OutboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const outbox_repository_1 = require("./outbox.repository");
const outbox_entity_1 = require("./outbox.entity");
const prisma_service_1 = require("../prisma.service");
let OutboxService = OutboxService_1 = class OutboxService {
    outboxRepository;
    prisma;
    logger = new common_1.Logger(OutboxService_1.name);
    constructor(outboxRepository, prisma) {
        this.outboxRepository = outboxRepository;
        this.prisma = prisma;
    }
    async saveEventInTransaction(event, businessOperation) {
        await this.prisma.$transaction(async (prisma) => {
            await businessOperation(prisma);
            const outboxEvent = new outbox_entity_1.OutboxEventEntity((0, uuid_1.v4)(), event.aggregateId, event.aggregateType, event.eventType, event.eventData);
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
            this.logger.log(`Event stored in outbox: ${event.eventType} for ${event.aggregateId}`);
        });
    }
    async saveEvent(event) {
        const outboxEvent = new outbox_entity_1.OutboxEventEntity((0, uuid_1.v4)(), event.aggregateId, event.aggregateType, event.eventType, event.eventData);
        return await this.outboxRepository.save(outboxEvent);
    }
    async markEventAsProcessing(eventId) {
        const events = await this.outboxRepository.findByAggregateId(eventId);
        const event = events.find((e) => e.id === eventId);
        if (!event) {
            throw new Error(`Outbox event not found: ${eventId}`);
        }
        const processingEvent = event.markAsProcessing();
        return await this.outboxRepository.update(processingEvent);
    }
    async markEventAsProcessed(eventId) {
        const events = await this.outboxRepository.findByAggregateId(eventId);
        const event = events.find((e) => e.id === eventId);
        if (!event) {
            throw new Error(`Outbox event not found: ${eventId}`);
        }
        const processedEvent = event.markAsProcessed();
        return await this.outboxRepository.update(processedEvent);
    }
    async markEventAsFailed(eventId, error) {
        const events = await this.outboxRepository.findByAggregateId(eventId);
        const event = events.find((e) => e.id === eventId);
        if (!event) {
            throw new Error(`Outbox event not found: ${eventId}`);
        }
        const failedEvent = event.markAsFailed(error);
        return await this.outboxRepository.update(failedEvent);
    }
    async getPendingEvents(limit = 10) {
        return await this.outboxRepository.findPendingEvents(limit);
    }
    async cleanupProcessedEvents(olderThanDays = 7) {
        const deletedCount = await this.outboxRepository.deleteProcessedEvents(olderThanDays);
        this.logger.log(`Cleaned up ${deletedCount} processed outbox events`);
        return deletedCount;
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = OutboxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [outbox_repository_1.OutboxRepository,
        prisma_service_1.PrismaService])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map