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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OutboxPublisherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxPublisherService = void 0;
const common_1 = require("@nestjs/common");
const outbox_service_1 = require("../database/outbox/outbox.service");
const injection_tokens_1 = require("../../shared/constants/injection-tokens");
let OutboxPublisherService = OutboxPublisherService_1 = class OutboxPublisherService {
    outboxService;
    messageQueue;
    logger = new common_1.Logger(OutboxPublisherService_1.name);
    isProcessing = false;
    processingInterval = null;
    constructor(outboxService, messageQueue) {
        this.outboxService = outboxService;
        this.messageQueue = messageQueue;
    }
    onModuleInit() {
        this.startProcessing();
    }
    onModuleDestroy() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
    }
    startProcessing() {
        this.logger.log('Starting outbox event publisher');
        this.processingInterval = setInterval(() => {
            void (async () => {
                if (!this.isProcessing) {
                    await this.processOutboxEvents();
                }
            })();
        }, 5000);
        setInterval(() => {
            void this.cleanupProcessedEvents();
        }, 60 * 60 * 1000);
    }
    async processOutboxEvents() {
        if (this.isProcessing) {
            return;
        }
        try {
            this.isProcessing = true;
            const pendingEvents = await this.outboxService.getPendingEvents(10);
            if (pendingEvents.length === 0) {
                return;
            }
            this.logger.log(`Processing ${pendingEvents.length} outbox events`);
            const promises = pendingEvents.map((event) => this.processEvent(event));
            await Promise.allSettled(promises);
        }
        catch (error) {
            this.logger.error('Error processing outbox events', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async processEvent(event) {
        try {
            await this.outboxService.markEventAsProcessing(event.id);
            await this.publishEventToQueue(event);
            await this.outboxService.markEventAsProcessed(event.id);
            this.logger.log(`Successfully published outbox event: ${event.eventType} for ${event.aggregateId}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to publish outbox event: ${event.eventType} for ${event.aggregateId}`, errorMessage);
            const failedEvent = await this.outboxService.markEventAsFailed(event.id, errorMessage);
            if (!failedEvent.canRetry()) {
                this.logger.error(`Outbox event exceeded max retries: ${event.eventType} for ${event.aggregateId}`);
                await this.handleFailedEvent(failedEvent);
            }
        }
    }
    async publishEventToQueue(event) {
        const message = {
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventData: event.eventData,
            metadata: {
                eventId: event.id,
                version: event.version,
                timestamp: event.createdAt.toISOString(),
            },
        };
        await this.messageQueue.sendMessage(message);
    }
    async handleFailedEvent(event) {
        this.logger.error(`Sending failed event to DLQ: ${event.eventType} for ${event.aggregateId}`);
    }
    async cleanupProcessedEvents() {
        try {
            const deletedCount = await this.outboxService.cleanupProcessedEvents(7);
            if (deletedCount > 0) {
                this.logger.log(`Cleaned up ${deletedCount} processed outbox events`);
            }
        }
        catch (error) {
            this.logger.error('Error cleaning up processed events', error);
        }
    }
    async triggerProcessing() {
        this.logger.log('Manually triggering outbox processing');
        await this.processOutboxEvents();
    }
    async getHealth() {
        const pendingEvents = await this.outboxService.getPendingEvents(1);
        return {
            isProcessing: this.isProcessing,
            pendingEvents: pendingEvents.length,
            lastProcessed: new Date(),
        };
    }
};
exports.OutboxPublisherService = OutboxPublisherService;
exports.OutboxPublisherService = OutboxPublisherService = OutboxPublisherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.MESSAGE_QUEUE)),
    __metadata("design:paramtypes", [outbox_service_1.OutboxService, Object])
], OutboxPublisherService);
//# sourceMappingURL=outbox-publisher.service.js.map