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
var DeadLetterQueueHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadLetterQueueHandler = void 0;
const common_1 = require("@nestjs/common");
const circuit_breaker_1 = require("./circuit-breaker");
let DeadLetterQueueHandler = DeadLetterQueueHandler_1 = class DeadLetterQueueHandler {
    logger = new common_1.Logger(DeadLetterQueueHandler_1.name);
    circuitBreaker;
    config = {
        maxRetries: 3,
        retryDelayMs: 5000,
        exponentialBackoff: true,
        maxRetryDelayMs: 60000,
    };
    constructor() {
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker('dlq-processor', {
            failureThreshold: 5,
            recoveryTimeout: 30000,
            monitoringPeriod: 60000,
            successThreshold: 3,
        });
    }
    handleFailedMessage(originalMessage, error, attemptCount, originalQueue) {
        const dlqMessage = {
            id: this.generateId(),
            originalMessage,
            failureReason: error.message,
            attemptCount,
            firstFailedAt: attemptCount === 1
                ? new Date()
                : this.extractFirstFailedAt(originalMessage),
            lastFailedAt: new Date(),
            originalQueue,
        };
        this.logger.error(`Message failed after ${attemptCount} attempts: ${error.message}`, { messageId: dlqMessage.id, originalQueue, error: error.stack });
        if (attemptCount >= this.config.maxRetries) {
            this.sendToDLQ(dlqMessage);
        }
        else {
            this.scheduleRetry(dlqMessage);
        }
    }
    sendToDLQ(message) {
        try {
            this.logger.warn(`Sending message to DLQ after ${message.attemptCount} failed attempts`, { messageId: message.id, originalQueue: message.originalQueue });
            this.storeDLQMessage(message);
            this.notifyDLQMessage(message);
        }
        catch (error) {
            this.logger.error(`Failed to send message to DLQ: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            this.escalateToManualIntervention(message, error instanceof Error ? error : new Error(String(error)));
        }
    }
    scheduleRetry(message) {
        const delay = this.calculateRetryDelay(message.attemptCount);
        this.logger.log(`Scheduling retry for message in ${delay}ms (attempt ${message.attemptCount + 1})`, { messageId: message.id });
        setTimeout(() => {
            void this.retryMessage(message);
        }, delay);
    }
    async retryMessage(message) {
        try {
            await this.circuitBreaker.execute(async () => {
                this.logger.log(`Retrying failed message (attempt ${message.attemptCount + 1})`, {
                    messageId: message.id,
                });
                this.reprocessMessage(message.originalMessage);
                return Promise.resolve();
            });
            this.logger.log(`Message retry succeeded`, { messageId: message.id });
        }
        catch (error) {
            this.handleFailedMessage(message.originalMessage, error instanceof Error ? error : new Error('Unknown retry error'), message.attemptCount + 1, message.originalQueue);
        }
    }
    processDLQMessages() {
        let processed = 0;
        let errors = 0;
        this.logger.log('Starting DLQ message processing');
        const dlqMessages = this.getDLQMessages();
        for (const message of dlqMessages) {
            try {
                this.reprocessDLQMessage(message);
                this.removeDLQMessage(message.id);
                processed++;
                this.logger.log(`Successfully reprocessed DLQ message`, {
                    messageId: message.id,
                });
            }
            catch (error) {
                errors++;
                this.logger.error(`Failed to reprocess DLQ message: ${error instanceof Error ? error.message : String(error)}`, {
                    messageId: message.id,
                    error: error instanceof Error ? error.stack : undefined,
                });
                this.updateDLQMessageFailure(message.id, error instanceof Error ? error : new Error(String(error)));
            }
        }
        this.logger.log(`DLQ processing completed: ${processed} processed, ${errors} errors`);
        return { processed, errors };
    }
    calculateRetryDelay(attemptCount) {
        if (!this.config.exponentialBackoff) {
            return this.config.retryDelayMs;
        }
        const exponentialDelay = this.config.retryDelayMs * Math.pow(2, attemptCount - 1);
        return Math.min(exponentialDelay, this.config.maxRetryDelayMs);
    }
    extractFirstFailedAt(originalMessage) {
        const firstFailedAt = originalMessage.firstFailedAt;
        return firstFailedAt &&
            (typeof firstFailedAt === 'string' ||
                typeof firstFailedAt === 'number' ||
                firstFailedAt instanceof Date)
            ? new Date(firstFailedAt)
            : new Date();
    }
    generateId() {
        return `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    storeDLQMessage(message) {
        this.logger.log(`Stored message in DLQ`, { messageId: message.id });
    }
    getDLQMessages() {
        return [];
    }
    removeDLQMessage(messageId) {
        this.logger.log(`Removed message from DLQ`, { messageId });
    }
    updateDLQMessageFailure(messageId, error) {
        this.logger.log(`Updated DLQ message failure`, {
            messageId,
            error: error.message,
        });
    }
    reprocessMessage(originalMessage) {
        this.logger.log('Reprocessing message through normal pipeline', {
            originalMessage,
        });
    }
    reprocessDLQMessage(message) {
        this.reprocessMessage(message.originalMessage);
    }
    notifyDLQMessage(message) {
        this.logger.warn(`DLQ Alert: Message sent to DLQ`, {
            messageId: message.id,
            originalQueue: message.originalQueue,
            failureReason: message.failureReason,
            totalAttempts: message.attemptCount,
        });
    }
    escalateToManualIntervention(message, error) {
        this.logger.error('CRITICAL: Failed to DLQ message - manual intervention required', {
            messageId: message.id,
            dlqError: error.message,
            originalError: message.failureReason,
        });
    }
    getHealthStatus() {
        return {
            isHealthy: this.circuitBreaker.getHealthStatus().isHealthy,
            circuitBreakerStatus: this.circuitBreaker.getHealthStatus(),
            config: this.config,
        };
    }
};
exports.DeadLetterQueueHandler = DeadLetterQueueHandler;
exports.DeadLetterQueueHandler = DeadLetterQueueHandler = DeadLetterQueueHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DeadLetterQueueHandler);
//# sourceMappingURL=dlq-handler.js.map