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
var SQSIdempotencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSIdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let SQSIdempotencyService = SQSIdempotencyService_1 = class SQSIdempotencyService {
    logger = new common_1.Logger(SQSIdempotencyService_1.name);
    processedMessages = new Map();
    TTL_SECONDS = 3600 * 24;
    constructor() {
        setInterval(() => this.cleanup(), 1000 * 3600);
    }
    isProcessed(message) {
        const key = this.buildMessageKey(message);
        try {
            const record = this.processedMessages.get(key);
            if (record) {
                if (record.expiresAt.getTime() < Date.now()) {
                    this.processedMessages.delete(key);
                    return false;
                }
                this.logger.debug(`Message already processed`, {
                    messageId: message.MessageId,
                    key,
                    result: record.processingResult,
                    processedAt: record.processedAt,
                });
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Failed to check if message is processed`, {
                messageId: message.MessageId,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    markAsProcessed(message, result, metadata) {
        const key = this.buildMessageKey(message);
        try {
            const record = {
                messageId: message.MessageId || 'unknown',
                messageGroupId: message.Attributes?.MessageGroupId,
                deduplicationId: message.Attributes?.MessageDeduplicationId,
                bodyHash: this.hashMessageBody(message.Body || ''),
                processedAt: new Date(),
                expiresAt: new Date(Date.now() + this.TTL_SECONDS * 1000),
                processingResult: result,
                metadata,
            };
            this.processedMessages.set(key, record);
            this.logger.debug(`Marked message as processed`, {
                messageId: message.MessageId,
                key,
                result,
            });
        }
        catch (error) {
            this.logger.error(`Failed to mark message as processed`, {
                messageId: message.MessageId,
                result,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    getProcessingRecord(message) {
        const key = this.buildMessageKey(message);
        try {
            const record = this.processedMessages.get(key);
            if (record && record.expiresAt.getTime() >= Date.now()) {
                return record;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Failed to get processing record`, {
                messageId: message.MessageId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    generateDeduplicationId(messageBody, context) {
        const content = typeof messageBody === 'string'
            ? messageBody
            : JSON.stringify(messageBody);
        const contextStr = context
            ? JSON.stringify(context, Object.keys(context).sort())
            : '';
        return (0, crypto_1.createHash)('sha256')
            .update(content + contextStr)
            .digest('hex');
    }
    generateMessageGroupId(messageBody) {
        if (typeof messageBody === 'object' &&
            messageBody !== null &&
            'patientId' in messageBody) {
            return `patient-${messageBody.patientId}`;
        }
        if (typeof messageBody === 'object' &&
            messageBody !== null &&
            'psychologistId' in messageBody) {
            return `psychologist-${messageBody.psychologistId}`;
        }
        return 'default-group';
    }
    validateMessageUniqueness(message) {
        const bodyHash = this.hashMessageBody(message.Body || '');
        for (const record of this.processedMessages.values()) {
            if (record.bodyHash === bodyHash &&
                record.expiresAt.getTime() >= Date.now()) {
                this.logger.warn(`Detected duplicate message content`, {
                    messageId: message.MessageId,
                    existingMessageId: record.messageId,
                    bodyHash,
                });
                return {
                    isUnique: false,
                    existingRecord: record,
                };
            }
        }
        return { isUnique: true };
    }
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];
        for (const [key, record] of this.processedMessages.entries()) {
            if (record.expiresAt.getTime() < now) {
                expiredKeys.push(key);
            }
        }
        expiredKeys.forEach((key) => this.processedMessages.delete(key));
        if (expiredKeys.length > 0) {
            this.logger.log(`Cleaned up ${expiredKeys.length} expired SQS idempotency records`);
        }
    }
    buildMessageKey(message) {
        if (message.MessageId) {
            return `msg:${message.MessageId}`;
        }
        const bodyHash = this.hashMessageBody(message.Body || '');
        return `hash:${bodyHash}`;
    }
    hashMessageBody(body) {
        return (0, crypto_1.createHash)('sha256').update(body).digest('hex');
    }
    getStats() {
        const records = Array.from(this.processedMessages.values());
        return {
            totalProcessed: records.length,
            successCount: records.filter((r) => r.processingResult === 'success')
                .length,
            failureCount: records.filter((r) => r.processingResult === 'failure')
                .length,
            retryCount: records.filter((r) => r.processingResult === 'retry').length,
            oldestRecord: records.length > 0
                ? new Date(Math.min(...records.map((r) => r.processedAt.getTime())))
                : undefined,
            newestRecord: records.length > 0
                ? new Date(Math.max(...records.map((r) => r.processedAt.getTime())))
                : undefined,
        };
    }
};
exports.SQSIdempotencyService = SQSIdempotencyService;
exports.SQSIdempotencyService = SQSIdempotencyService = SQSIdempotencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SQSIdempotencyService);
//# sourceMappingURL=sqs-idempotency.service.js.map