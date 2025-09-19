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
var TransactionalOutboxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionalOutboxService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const aws_sqs_producer_1 = require("../../messaging/aws-sqs.producer");
const schedule_1 = require("@nestjs/schedule");
let TransactionalOutboxService = TransactionalOutboxService_1 = class TransactionalOutboxService {
    prisma;
    messageProducer;
    logger = new common_1.Logger(TransactionalOutboxService_1.name);
    MAX_BATCH_SIZE = 10;
    MAX_RETRIES = 3;
    constructor(prisma, messageProducer) {
        this.prisma = prisma;
        this.messageProducer = messageProducer;
    }
    async storeEvent(event, tx) {
        const prismaClient = tx || this.prisma;
        await prismaClient.outboxEvent.create({
            data: {
                aggregateId: event.aggregateId,
                aggregateType: event.aggregateType,
                eventType: event.eventType,
                eventData: event.eventData,
                status: 'PENDING',
                version: event.version || 1,
            },
        });
        this.logger.log(`Event stored in outbox: ${event.eventType} for ${event.aggregateId}`);
    }
    async storeEvents(events, tx) {
        const prismaClient = tx || this.prisma;
        await prismaClient.outboxEvent.createMany({
            data: events.map((event) => ({
                aggregateId: event.aggregateId,
                aggregateType: event.aggregateType,
                eventType: event.eventType,
                eventData: event.eventData,
                status: 'PENDING',
                version: event.version || 1,
            })),
        });
        this.logger.log(`${events.length} events stored in outbox`);
    }
    async processOutboxEvents() {
        try {
            const pendingEvents = await this.prisma.outboxEvent.findMany({
                where: {
                    status: 'PENDING',
                    retryCount: { lt: this.MAX_RETRIES },
                },
                orderBy: { createdAt: 'asc' },
                take: this.MAX_BATCH_SIZE,
            });
            if (pendingEvents.length === 0) {
                return;
            }
            this.logger.log(`Processing ${pendingEvents.length} outbox events`);
            for (const event of pendingEvents) {
                await this.processEvent(event);
            }
        }
        catch (error) {
            this.logger.error('Error processing outbox events:', error);
        }
    }
    async processEvent(event) {
        try {
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                    status: 'PROCESSING',
                    retryCount: event.retryCount + 1,
                },
            });
            await this.messageProducer.sendMessage({
                ...event.eventData,
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                version: event.version,
                occurredAt: event.createdAt.toISOString(),
            });
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                },
            });
            this.logger.log(`Event processed: ${event.eventType} for ${event.aggregateId}`);
        }
        catch (error) {
            await this.handleEventError(event, error);
        }
    }
    async handleEventError(event, error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (event.retryCount >= this.MAX_RETRIES) {
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                    status: 'FAILED',
                    error: errorMessage,
                },
            });
            this.logger.error(`Event failed after max retries: ${event.eventType} - ${errorMessage}`);
        }
        else {
            await this.prisma.outboxEvent.update({
                where: { id: event.id },
                data: {
                    status: 'PENDING',
                    error: errorMessage,
                },
            });
            this.logger.warn(`Event retry ${event.retryCount}/${this.MAX_RETRIES}: ${event.eventType} - ${errorMessage}`);
        }
    }
    async getOutboxStats() {
        const stats = await this.prisma.outboxEvent.groupBy({
            by: ['status'],
            _count: { status: true },
        });
        const result = {
            pending: 0,
            processing: 0,
            processed: 0,
            failed: 0,
        };
        stats.forEach((stat) => {
            const status = stat.status.toLowerCase();
            if (status in result) {
                result[status] = stat._count.status;
            }
        });
        return result;
    }
    async cleanupOldEvents() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            const deleted = await this.prisma.outboxEvent.deleteMany({
                where: {
                    status: 'PROCESSED',
                    processedAt: { lt: cutoffDate },
                },
            });
            this.logger.log(`Cleaned up ${deleted.count} old outbox events`);
        }
        catch (error) {
            this.logger.error('Error cleaning up old events:', error);
        }
    }
};
exports.TransactionalOutboxService = TransactionalOutboxService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionalOutboxService.prototype, "processOutboxEvents", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionalOutboxService.prototype, "cleanupOldEvents", null);
exports.TransactionalOutboxService = TransactionalOutboxService = TransactionalOutboxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        aws_sqs_producer_1.AwsSqsProducer])
], TransactionalOutboxService);
//# sourceMappingURL=transactional-outbox.service.js.map