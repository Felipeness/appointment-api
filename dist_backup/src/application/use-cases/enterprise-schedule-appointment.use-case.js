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
var EnterpriseScheduleAppointmentUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseScheduleAppointmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const aws_sqs_producer_1 = require("../../infrastructure/messaging/aws-sqs.producer");
const injection_tokens_1 = require("../../shared/constants/injection-tokens");
const domain_exceptions_1 = require("../../common/exceptions/domain.exceptions");
const enums_1 = require("../../domain/entities/enums");
const uuid_1 = require("uuid");
const date_fns_1 = require("date-fns");
let EnterpriseScheduleAppointmentUseCase = EnterpriseScheduleAppointmentUseCase_1 = class EnterpriseScheduleAppointmentUseCase {
    enterpriseQueue;
    psychologistRepository;
    logger = new common_1.Logger(EnterpriseScheduleAppointmentUseCase_1.name);
    constructor(enterpriseQueue, psychologistRepository) {
        this.enterpriseQueue = enterpriseQueue;
        this.psychologistRepository = psychologistRepository;
    }
    async execute(dto, options) {
        const appointmentId = (0, uuid_1.v4)();
        const traceId = options?.traceId ?? this.generateTraceId();
        const priority = this.determinePriority(dto, options?.priority);
        this.logger.log(`Starting enterprise appointment scheduling`, {
            appointmentId,
            traceId,
            priority,
            patientEmail: dto.patientEmail,
            psychologistId: dto.psychologistId,
        });
        try {
            await this.performPreQueueValidation(dto, traceId);
            const appointmentMessage = {
                appointmentId,
                patientEmail: dto.patientEmail,
                patientName: dto.patientName,
                patientPhone: dto.patientPhone,
                psychologistId: dto.psychologistId,
                scheduledAt: dto.scheduledAt,
                duration: dto.duration ?? 60,
                appointmentType: dto.appointmentType,
                meetingType: dto.meetingType,
                meetingUrl: dto.meetingUrl,
                meetingRoom: dto.meetingRoom,
                reason: dto.reason,
                notes: dto.notes,
                consultationFee: dto.consultationFee,
            };
            await this.enterpriseQueue.sendMessage(appointmentMessage, {
                priority,
                traceId,
                delaySeconds: this.calculateDelaySeconds(priority),
            });
            const result = {
                appointmentId,
                status: 'queued',
                queuedAt: new Date().toISOString(),
                estimatedProcessingTime: this.estimateProcessingTime(priority),
                traceId,
                priority,
            };
            this.logger.log(`Appointment successfully queued for processing`, {
                appointmentId,
                traceId,
                priority,
                estimatedProcessingTime: result.estimatedProcessingTime,
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to queue appointment`, {
                appointmentId,
                traceId,
                error: error.message,
                stack: error.stack,
            });
            return {
                appointmentId,
                status: 'failed',
                queuedAt: new Date().toISOString(),
                traceId,
                priority,
            };
        }
    }
    async performPreQueueValidation(dto, traceId) {
        const psychologist = await this.psychologistRepository.findById(dto.psychologistId);
        if (!psychologist) {
            throw new domain_exceptions_1.PsychologistNotFoundException(dto.psychologistId);
        }
        if (!psychologist.isActive) {
            throw new domain_exceptions_1.PsychologistNotFoundException(`Psychologist ${dto.psychologistId} is not active`);
        }
        const scheduledTime = new Date(dto.scheduledAt);
        const minimumBookingTime = (0, date_fns_1.addHours)(new Date(), 24);
        if ((0, date_fns_1.isBefore)(scheduledTime, minimumBookingTime)) {
            throw new Error('Appointments must be scheduled at least 24 hours in advance');
        }
        this.logger.debug(`Pre-queue validation passed`, {
            psychologistId: dto.psychologistId,
            scheduledAt: dto.scheduledAt,
            traceId,
        });
    }
    determinePriority(dto, requestedPriority) {
        if (requestedPriority === 'high')
            return 'high';
        if (dto.appointmentType === enums_1.AppointmentType.EMERGENCY ||
            dto.reason?.toLowerCase().includes('urgent')) {
            return 'high';
        }
        if (dto.appointmentType === enums_1.AppointmentType.FOLLOW_UP) {
            return 'normal';
        }
        return 'low';
    }
    getMessageGroupId(dto) {
        return `psychologist-${dto.psychologistId}`;
    }
    getDeduplicationId(appointmentId, dto) {
        const dedupeKey = `${dto.patientEmail}-${dto.psychologistId}-${dto.scheduledAt}`;
        return `${appointmentId}-${Buffer.from(dedupeKey).toString('base64')}`;
    }
    calculateDelaySeconds(priority) {
        switch (priority) {
            case 'high':
                return 0;
            case 'normal':
                return 5;
            case 'low':
                return 10;
            default:
                return 5;
        }
    }
    estimateProcessingTime(priority) {
        const baseTime = new Date();
        let estimatedMinutes;
        switch (priority) {
            case 'high':
                estimatedMinutes = 1;
                break;
            case 'normal':
                estimatedMinutes = 5;
                break;
            case 'low':
                estimatedMinutes = 15;
                break;
            default:
                estimatedMinutes = 5;
        }
        baseTime.setMinutes(baseTime.getMinutes() + estimatedMinutes);
        return baseTime.toISOString();
    }
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async executeBatch(appointments, options) {
        const batchId = options?.batchId ?? (0, uuid_1.v4)();
        const traceId = options?.traceId ?? this.generateTraceId();
        this.logger.log(`Starting batch appointment scheduling`, {
            batchId,
            traceId,
            appointmentCount: appointments.length,
        });
        const results = [];
        for (let i = 0; i < appointments.length; i += 10) {
            const batch = appointments.slice(i, i + 10);
            const batchResults = await Promise.allSettled(batch.map((dto) => this.execute(dto, {
                ...options,
                traceId: `${traceId}-${i / 10 + 1}`,
            })));
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    results.push({
                        appointmentId: (0, uuid_1.v4)(),
                        status: 'failed',
                        queuedAt: new Date().toISOString(),
                        traceId,
                        priority: options?.priority ?? 'normal',
                    });
                    this.logger.error(`Batch appointment failed`, {
                        batchId,
                        traceId,
                        appointmentIndex: i + index,
                        error: result && typeof result === 'object' && 'reason' in result
                            ? result.reason
                            : 'Unknown error',
                    });
                }
            });
        }
        this.logger.log(`Batch appointment scheduling completed`, {
            batchId,
            traceId,
            successful: results.filter((r) => r.status === 'queued').length,
            failed: results.filter((r) => r.status === 'failed').length,
        });
        return results;
    }
};
exports.EnterpriseScheduleAppointmentUseCase = EnterpriseScheduleAppointmentUseCase;
exports.EnterpriseScheduleAppointmentUseCase = EnterpriseScheduleAppointmentUseCase = EnterpriseScheduleAppointmentUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.ENTERPRISE_MESSAGE_QUEUE)),
    __param(1, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY)),
    __metadata("design:paramtypes", [aws_sqs_producer_1.AwsSqsProducer, Object])
], EnterpriseScheduleAppointmentUseCase);
//# sourceMappingURL=enterprise-schedule-appointment.use-case.js.map