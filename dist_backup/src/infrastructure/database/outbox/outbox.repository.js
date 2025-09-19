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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const outbox_entity_1 = require("./outbox.entity");
let OutboxRepository = class OutboxRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(event) {
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
    async update(event) {
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
    async findPendingEvents(limit = 10) {
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
        return events.map((event) => this.toDomain(event));
    }
    async findByAggregateId(aggregateId) {
        const events = await this.prisma.outboxEvent.findMany({
            where: { aggregateId },
            orderBy: { createdAt: 'asc' },
        });
        return events.map((event) => this.toDomain(event));
    }
    async deleteProcessedEvents(olderThanDays = 7) {
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
    toDomain(event) {
        return new outbox_entity_1.OutboxEventEntity(event.id, event.aggregateId, event.aggregateType, event.eventType, JSON.parse(event.eventData), event.createdAt, event.processedAt || undefined, event.retryCount, event.maxRetries, event.status, event.error || undefined, event.version);
    }
};
exports.OutboxRepository = OutboxRepository;
exports.OutboxRepository = OutboxRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutboxRepository);
//# sourceMappingURL=outbox.repository.js.map