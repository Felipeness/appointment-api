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
var EnterpriseAppointmentConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseAppointmentConsumer = void 0;
const common_1 = require("@nestjs/common");
const nestjs_sqs_1 = require("@ssut/nestjs-sqs");
const resilient_process_appointment_use_case_1 = require("../../application/use-cases/resilient-process-appointment.use-case");
const dlq_handler_1 = require("../../common/resilience/dlq-handler");
const process_appointment_use_case_1 = require("../../application/use-cases/process-appointment.use-case");
const sqs_idempotency_service_1 = require("../../common/services/sqs-idempotency.service");
let EnterpriseAppointmentConsumer = EnterpriseAppointmentConsumer_1 = class EnterpriseAppointmentConsumer {
    resilientProcessor;
    processAppointmentUseCase;
    dlqHandler;
    sqsIdempotencyService;
    logger = new common_1.Logger(EnterpriseAppointmentConsumer_1.name);
    constructor(resilientProcessor, processAppointmentUseCase, dlqHandler, sqsIdempotencyService) {
        this.resilientProcessor = resilientProcessor;
        this.processAppointmentUseCase = processAppointmentUseCase;
        this.dlqHandler = dlqHandler;
        this.sqsIdempotencyService = sqsIdempotencyService;
    }
    async handleAppointmentMessage(message) {
        const startTime = Date.now();
        let parsedMessage;
        let traceId;
        let messageType;
        try {
            const isAlreadyProcessed = this.sqsIdempotencyService.isProcessed(message);
            if (isAlreadyProcessed) {
                const record = this.sqsIdempotencyService.getProcessingRecord(message);
                this.logger.log(`Skipping already processed message`, {
                    messageId: message.MessageId,
                    previousResult: record?.processingResult,
                    processedAt: record?.processedAt,
                });
                return;
            }
            const uniqueness = this.sqsIdempotencyService.validateMessageUniqueness(message);
            if (!uniqueness.isUnique) {
                this.logger.warn(`Detected duplicate message content, skipping`, {
                    messageId: message.MessageId,
                    existingMessageId: uniqueness.existingRecord?.messageId,
                });
                this.sqsIdempotencyService.markAsProcessed(message, 'success', {
                    reason: 'duplicate_content',
                    existingMessageId: uniqueness.existingRecord?.messageId,
                });
                return;
            }
            parsedMessage = JSON.parse(message.Body ?? '{}');
            traceId = this.extractTraceId(message);
            messageType = this.extractMessageType(message);
            this.logger.log(`Processing message`, {
                messageId: message.MessageId,
                traceId,
                messageType,
                receiptHandle: message.ReceiptHandle?.substring(0, 20) + '...',
            });
            if (this.isEnterpriseMessage(parsedMessage)) {
                await this.processEnterpriseMessage(parsedMessage, traceId);
            }
            else {
                await this.processLegacyMessage(parsedMessage, traceId);
            }
            const processingTime = Date.now() - startTime;
            this.sqsIdempotencyService.markAsProcessed(message, 'success', {
                processingTimeMs: processingTime,
                traceId,
                messageType,
            });
            this.logger.log(`Message processed successfully`, {
                messageId: message.MessageId,
                traceId,
                processingTimeMs: processingTime,
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            this.sqsIdempotencyService.markAsProcessed(message, 'failure', {
                processingTimeMs: processingTime,
                traceId: traceId,
                errorMessage: error.message,
                errorStack: error.stack,
            });
            this.logger.error(`Message processing failed`, {
                messageId: message.MessageId,
                traceId: traceId,
                error: error.message,
                processingTimeMs: processingTime,
                stack: error.stack,
            });
            throw error;
        }
    }
    async processEnterpriseMessage(message, traceId) {
        const retryCount = (message.retryCount ?? 0) + 1;
        message.retryCount = retryCount;
        this.logger.debug(`Processing enterprise message`, {
            messageId: message.id,
            messageType: message.type,
            version: message.version,
            retryCount,
            traceId,
        });
        switch (message.type) {
            case 'appointment.requested':
            case 'appointment.confirmed':
            case 'appointment.cancelled':
                await this.resilientProcessor.executeWithResilience(message.data, retryCount);
                break;
            default:
                this.logger.warn(`Unknown enterprise message type: ${message.type}`, {
                    messageId: message.id,
                    traceId,
                });
                throw new Error(`Unsupported message type: ${message.type}`);
        }
    }
    async processLegacyMessage(message, traceId) {
        this.logger.debug(`Processing legacy message format`, {
            appointmentId: message.appointmentId,
            traceId,
        });
        await this.resilientProcessor.executeWithResilience(message, 1);
    }
    onProcessingError(error, message) {
        const messageId = message.MessageId;
        const traceId = this.extractTraceId(message);
        this.logger.error(`SQS message processing error`, {
            messageId,
            traceId,
            error: error.message,
            messageBody: message.Body?.substring(0, 200) + '...',
            stack: error.stack,
        });
        try {
            const parsedMessage = JSON.parse(message.Body ?? '{}');
            const attemptCount = this.getAttemptCount(message);
            this.dlqHandler.handleFailedMessage(parsedMessage, error, attemptCount, 'appointment-processing');
        }
        catch (parseError) {
            this.logger.error(`Failed to parse message for DLQ processing`, {
                messageId,
                traceId,
                parseError: parseError.message,
            });
        }
    }
    onError(error, message) {
        this.logger.error(`SQS consumer error`, {
            error: error.message,
            messageId: message?.MessageId,
            stack: error.stack,
        });
    }
    onTimeoutError(error, message) {
        const traceId = this.extractTraceId(message);
        this.logger.error(`Message processing timeout`, {
            messageId: message.MessageId,
            traceId,
            error: error.message,
            visibilityTimeout: 'Message will return to queue for retry',
        });
    }
    onMessageReceived(message) {
        const messageType = this.extractMessageType(message);
        const traceId = this.extractTraceId(message);
        this.logger.debug(`Message received`, {
            messageId: message.MessageId,
            messageType,
            traceId,
            receivedAt: new Date().toISOString(),
        });
    }
    onMessageProcessed(message) {
        const traceId = this.extractTraceId(message);
        this.logger.debug(`Message processed and deleted`, {
            messageId: message.MessageId,
            traceId,
            processedAt: new Date().toISOString(),
        });
    }
    extractTraceId(message) {
        const traceId = message.MessageAttributes?.traceId?.StringValue ??
            message.MessageAttributes?.TraceId?.StringValue;
        return traceId ?? `generated_${message.MessageId}`;
    }
    extractMessageType(message) {
        return (message.MessageAttributes?.messageType?.StringValue ??
            message.MessageAttributes?.MessageType?.StringValue ??
            'unknown');
    }
    isEnterpriseMessage(message) {
        return Boolean(message.id &&
            message.type &&
            message.version &&
            message.timestamp);
    }
    getAttemptCount(message) {
        const receiveCount = message.Attributes?.ApproximateReceiveCount;
        return receiveCount ? parseInt(receiveCount, 10) : 1;
    }
    getConsumerStatus() {
        return {
            isHealthy: true,
            lastProcessedAt: new Date().toISOString(),
            messagesProcessed: 0,
            errors: 0,
        };
    }
};
exports.EnterpriseAppointmentConsumer = EnterpriseAppointmentConsumer;
__decorate([
    (0, nestjs_sqs_1.SqsMessageHandler)('appointment-consumer', false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EnterpriseAppointmentConsumer.prototype, "handleAppointmentMessage", null);
__decorate([
    (0, nestjs_sqs_1.SqsConsumerEventHandler)('appointment-consumer', 'processing_error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Error, Object]),
    __metadata("design:returntype", void 0)
], EnterpriseAppointmentConsumer.prototype, "onProcessingError", null);
__decorate([
    (0, nestjs_sqs_1.SqsConsumerEventHandler)('appointment-consumer', 'error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Error, Object]),
    __metadata("design:returntype", void 0)
], EnterpriseAppointmentConsumer.prototype, "onError", null);
__decorate([
    (0, nestjs_sqs_1.SqsConsumerEventHandler)('appointment-consumer', 'timeout_error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Error, Object]),
    __metadata("design:returntype", void 0)
], EnterpriseAppointmentConsumer.prototype, "onTimeoutError", null);
__decorate([
    (0, nestjs_sqs_1.SqsConsumerEventHandler)('appointment-consumer', 'message_received'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseAppointmentConsumer.prototype, "onMessageReceived", null);
__decorate([
    (0, nestjs_sqs_1.SqsConsumerEventHandler)('appointment-consumer', 'message_processed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseAppointmentConsumer.prototype, "onMessageProcessed", null);
exports.EnterpriseAppointmentConsumer = EnterpriseAppointmentConsumer = EnterpriseAppointmentConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resilient_process_appointment_use_case_1.ResilientProcessAppointmentUseCase,
        process_appointment_use_case_1.ProcessAppointmentUseCase,
        dlq_handler_1.DeadLetterQueueHandler,
        sqs_idempotency_service_1.SQSIdempotencyService])
], EnterpriseAppointmentConsumer);
//# sourceMappingURL=enterprise-appointment.consumer.js.map