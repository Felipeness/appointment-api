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
var AwsSqsProducer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsSqsProducer = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const circuit_breaker_1 = require("../../common/resilience/circuit-breaker");
let AwsSqsProducer = AwsSqsProducer_1 = class AwsSqsProducer {
    configService;
    logger = new common_1.Logger(AwsSqsProducer_1.name);
    circuitBreaker;
    sqsClient;
    queueUrl;
    constructor(configService) {
        this.configService = configService;
        const awsConfig = this.configService.get('aws');
        if (!awsConfig) {
            throw new Error('AWS configuration is required');
        }
        this.queueUrl = awsConfig.sqsQueueUrl;
        const clientConfig = {
            region: awsConfig.region,
        };
        if (awsConfig.endpointUrl) {
            clientConfig.endpoint = awsConfig.endpointUrl;
            clientConfig.forcePathStyle = true;
        }
        if (awsConfig.accessKeyId && awsConfig.secretAccessKey) {
            clientConfig.credentials = {
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey,
            };
        }
        this.sqsClient = new client_sqs_1.SQSClient(clientConfig);
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker('aws-sqs-producer', {
            failureThreshold: 5,
            recoveryTimeout: 30000,
            monitoringPeriod: 60000,
            successThreshold: 3,
        });
        this.logger.log('AWS SQS Producer initialized', {
            queueUrl: this.queueUrl,
            region: awsConfig.region,
            hasEndpoint: !!awsConfig.endpointUrl,
            hasCredentials: !!(awsConfig.accessKeyId && awsConfig.secretAccessKey),
        });
    }
    async sendMessage(message, options) {
        const enterpriseMessage = this.wrapMessage(message, options);
        await this.circuitBreaker.execute(async () => {
            try {
                const commandParams = {
                    QueueUrl: this.queueUrl,
                    MessageBody: JSON.stringify(enterpriseMessage),
                    DelaySeconds: options?.delaySeconds,
                    MessageAttributes: {
                        messageType: {
                            StringValue: enterpriseMessage.type,
                            DataType: 'String',
                        },
                        version: {
                            StringValue: enterpriseMessage.version,
                            DataType: 'String',
                        },
                        priority: {
                            StringValue: enterpriseMessage.priority ?? 'normal',
                            DataType: 'String',
                        },
                        source: {
                            StringValue: enterpriseMessage.source,
                            DataType: 'String',
                        },
                        traceId: {
                            StringValue: enterpriseMessage.traceId ?? 'unknown',
                            DataType: 'String',
                        },
                        correlationId: {
                            StringValue: enterpriseMessage.correlationId ?? enterpriseMessage.id,
                            DataType: 'String',
                        },
                        timestamp: {
                            StringValue: enterpriseMessage.timestamp,
                            DataType: 'String',
                        },
                    },
                };
                if (options?.messageGroupId) {
                    commandParams.MessageGroupId = options.messageGroupId;
                }
                if (options?.deduplicationId) {
                    commandParams.MessageDeduplicationId = options.deduplicationId;
                }
                const command = new client_sqs_1.SendMessageCommand(commandParams);
                const result = await this.sqsClient.send(command);
                this.logger.log('Message sent successfully to SQS', {
                    messageId: result.MessageId,
                    enterpriseMessageId: enterpriseMessage.id,
                    type: enterpriseMessage.type,
                    traceId: enterpriseMessage.traceId,
                    queueUrl: this.queueUrl,
                });
            }
            catch (error) {
                this.logger.error('Failed to send message to SQS', {
                    error: error instanceof Error ? error.message : String(error),
                    messageId: enterpriseMessage.id,
                    queueUrl: this.queueUrl,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                throw error;
            }
        });
    }
    async sendBatchMessages(messages, options) {
        const batches = this.chunkArray(messages, 10);
        for (const batch of batches) {
            const promises = batch.map((message) => this.sendMessage(message, {
                ...options,
                deduplicationId: `${typeof message.appointmentId === 'string' ? message.appointmentId : 'unknown'}-${Date.now()}`,
            }));
            await Promise.all(promises);
        }
        this.logger.log(`Sent ${messages.length} messages in ${batches.length} batches`);
    }
    async receiveMessages() {
        await Promise.resolve();
        throw new Error('Use consumer service for receiving messages');
    }
    async deleteMessage() {
        await Promise.resolve();
        throw new Error('Message deletion handled automatically by consumer');
    }
    wrapMessage(data, options) {
        const messageId = this.generateMessageId();
        const timestamp = new Date().toISOString();
        return {
            id: messageId,
            type: this.inferMessageType(data),
            version: '1.0',
            timestamp,
            source: 'appointment-api',
            data,
            traceId: options?.traceId ?? this.generateTraceId(),
            correlationId: typeof data.appointmentId === 'string' ? data.appointmentId : messageId,
            retryCount: 0,
            priority: options?.priority ?? 'normal',
        };
    }
    inferMessageType(data) {
        if (data.appointmentId) {
            if (data.status === 'cancelled')
                return 'appointment.cancelled';
            if (data.status === 'confirmed')
                return 'appointment.confirmed';
            return 'appointment.requested';
        }
        return 'unknown';
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    getHealthStatus() {
        return {
            isHealthy: this.circuitBreaker.getHealthStatus().isHealthy,
            circuitBreakerStatus: this.circuitBreaker.getHealthStatus(),
            stats: {
                messagesSent: 0,
                lastMessageTime: new Date().toISOString(),
            },
        };
    }
    resetCircuitBreaker() {
        this.circuitBreaker.forceClose();
        this.logger.log('AWS SQS producer circuit breaker reset manually');
    }
    openCircuitBreaker() {
        this.circuitBreaker.forceOpen();
        this.logger.warn('AWS SQS producer circuit breaker opened manually');
    }
};
exports.AwsSqsProducer = AwsSqsProducer;
exports.AwsSqsProducer = AwsSqsProducer = AwsSqsProducer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AwsSqsProducer);
//# sourceMappingURL=aws-sqs.producer.js.map