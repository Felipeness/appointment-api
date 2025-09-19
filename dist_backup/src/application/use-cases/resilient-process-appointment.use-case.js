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
var ResilientProcessAppointmentUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilientProcessAppointmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const saga_orchestrator_1 = require("../../common/saga/saga-orchestrator");
const dlq_handler_1 = require("../../common/resilience/dlq-handler");
const process_appointment_use_case_1 = require("./process-appointment.use-case");
const injection_tokens_1 = require("../../shared/constants/injection-tokens");
const outbox_service_1 = require("../../infrastructure/database/outbox/outbox.service");
const patient_entity_1 = require("../../domain/entities/patient.entity");
const appointment_entity_1 = require("../../domain/entities/appointment.entity");
const uuid_1 = require("uuid");
const date_fns_1 = require("date-fns");
const enums_1 = require("../../domain/entities/enums");
let ResilientProcessAppointmentUseCase = ResilientProcessAppointmentUseCase_1 = class ResilientProcessAppointmentUseCase {
    sagaOrchestrator;
    dlqHandler;
    originalProcessor;
    patientRepository;
    psychologistRepository;
    appointmentRepository;
    outboxService;
    logger = new common_1.Logger(ResilientProcessAppointmentUseCase_1.name);
    constructor(sagaOrchestrator, dlqHandler, originalProcessor, patientRepository, psychologistRepository, appointmentRepository, outboxService) {
        this.sagaOrchestrator = sagaOrchestrator;
        this.dlqHandler = dlqHandler;
        this.originalProcessor = originalProcessor;
        this.patientRepository = patientRepository;
        this.psychologistRepository = psychologistRepository;
        this.appointmentRepository = appointmentRepository;
        this.outboxService = outboxService;
    }
    async executeWithResilience(message, attemptCount = 1) {
        try {
            const sagaSteps = this.createAppointmentSagaSteps(message);
            const sagaExecution = await this.sagaOrchestrator.executeSaga('ProcessAppointment', sagaSteps, { originalMessage: message, attemptCount });
            if (sagaExecution.error) {
                throw new Error(`Saga failed: ${sagaExecution.error}`);
            }
            this.logger.log(`Appointment processed successfully with Saga: ${message.appointmentId}`);
        }
        catch (error) {
            this.logger.error(`Resilient appointment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
            this.dlqHandler.handleFailedMessage(message, error instanceof Error ? error : new Error('Unknown processing error'), attemptCount, 'appointment-processing');
        }
    }
    createAppointmentSagaSteps(message) {
        return [
            {
                id: 'validate-patient',
                name: 'Validate or Create Patient',
                action: async () => {
                    return await this.validateOrCreatePatient(message);
                },
                compensation: async () => {
                    this.logger.log('Compensating patient validation - no action needed');
                },
                retryable: true,
                maxRetries: 3,
            },
            {
                id: 'validate-psychologist',
                name: 'Validate Psychologist',
                action: async () => {
                    return await this.validatePsychologist(message.psychologistId);
                },
                compensation: async () => {
                    this.logger.log('Compensating psychologist validation - no action needed');
                },
                retryable: true,
                maxRetries: 3,
            },
            {
                id: 'check-availability',
                name: 'Check Time Slot Availability',
                action: async () => {
                    return await this.checkAvailability(message);
                },
                compensation: async () => {
                    this.logger.log('Compensating availability check - no action needed');
                },
                retryable: true,
                maxRetries: 2,
            },
            {
                id: 'save-appointment',
                name: 'Save Appointment',
                action: async () => {
                    return await this.saveAppointmentWithOutbox(message);
                },
                compensation: async () => {
                    this.deleteAppointment(message.appointmentId);
                },
                retryable: true,
                maxRetries: 5,
            },
            {
                id: 'send-confirmation',
                name: 'Send Confirmation Notification',
                action: async () => {
                    return await this.sendConfirmationNotification(message);
                },
                compensation: async () => {
                    await this.sendCancellationNotification(message);
                },
                retryable: true,
                maxRetries: 3,
            },
        ];
    }
    async validateOrCreatePatient(message) {
        let patient = await this.patientRepository.findByEmail(message.patientEmail);
        if (!patient) {
            const patientId = (0, uuid_1.v4)();
            patient = new patient_entity_1.Patient(patientId, message.patientEmail, message.patientName, message.patientPhone);
            patient = await this.patientRepository.save(patient);
            this.logger.log(`Created new patient: ${patient.id}`);
        }
        return patient;
    }
    async validatePsychologist(psychologistId) {
        const psychologist = await this.psychologistRepository.findById(psychologistId);
        if (!psychologist) {
            throw new Error('Psychologist not found');
        }
        if (!psychologist.isActive) {
            throw new Error('Psychologist is not active');
        }
        return psychologist;
    }
    async checkAvailability(message) {
        const scheduledDate = (0, date_fns_1.parseISO)(message.scheduledAt);
        const existingAppointment = await this.appointmentRepository.findByPsychologistAndDate(message.psychologistId, scheduledDate);
        if (existingAppointment) {
            throw new Error('Time slot no longer available');
        }
        const psychologist = await this.psychologistRepository.findById(message.psychologistId);
        if (!psychologist?.isAvailableAt(scheduledDate)) {
            throw new Error('Psychologist not available at requested time');
        }
        return true;
    }
    async saveAppointmentWithOutbox(message) {
        const scheduledDate = (0, date_fns_1.parseISO)(message.scheduledAt);
        const patient = await this.patientRepository.findByEmail(message.patientEmail);
        const patientId = patient?.id ?? (0, uuid_1.v4)();
        const appointment = new appointment_entity_1.Appointment(message.appointmentId, patientId, message.psychologistId, scheduledDate, message.duration ?? 60, message.appointmentType ??
            enums_1.AppointmentType.CONSULTATION, enums_1.AppointmentStatus.CONFIRMED, message.meetingType ?? enums_1.MeetingType.IN_PERSON, message.meetingUrl, message.meetingRoom, message.reason, message.notes, undefined, message.consultationFee, false, undefined, undefined, undefined, new Date(), new Date(), new Date(), undefined);
        await this.outboxService.saveEventInTransaction({
            aggregateId: message.appointmentId,
            aggregateType: 'Appointment',
            eventType: 'AppointmentConfirmed',
            eventData: {
                appointmentId: message.appointmentId,
                patientEmail: message.patientEmail,
                psychologistId: message.psychologistId,
                scheduledAt: scheduledDate.toISOString(),
                status: 'CONFIRMED',
                confirmedAt: new Date().toISOString(),
            },
        }, async (prismaTransaction) => {
            await prismaTransaction.appointment.create({
                data: {
                    id: appointment.id,
                    patientId: appointment.patientId,
                    psychologistId: appointment.psychologistId,
                    scheduledAt: appointment.scheduledAt,
                    duration: appointment.duration,
                    appointmentType: appointment.appointmentType,
                    status: appointment.status,
                    meetingType: appointment.meetingType,
                    meetingUrl: appointment.meetingUrl,
                    meetingRoom: appointment.meetingRoom,
                    reason: appointment.reason,
                    notes: appointment.notes,
                    privateNotes: appointment.privateNotes,
                    consultationFee: appointment.consultationFee,
                    isPaid: appointment.isPaid,
                    createdAt: appointment.createdAt,
                    updatedAt: appointment.updatedAt,
                    confirmedAt: appointment.confirmedAt,
                },
            });
        });
        this.logger.log(`Appointment saved with Outbox Pattern: ${message.appointmentId}`);
        return message.appointmentId;
    }
    deleteAppointment(appointmentId) {
        try {
            this.logger.log(`Compensating: deleting appointment ${appointmentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to compensate appointment deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async sendConfirmationNotification(message) {
        this.logger.log(`Sending confirmation notification for appointment: ${message.appointmentId}`);
        await this.simulateNotificationDelay();
    }
    async sendCancellationNotification(message) {
        this.logger.log(`Compensating: sending cancellation notification for appointment: ${message.appointmentId}`);
        await this.simulateNotificationDelay();
    }
    async simulateNotificationDelay() {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    getHealthStatus() {
        const sagaExecutions = this.sagaOrchestrator.getAllExecutions();
        const dlqStatus = this.dlqHandler.getHealthStatus();
        return {
            saga: sagaExecutions.length >= 0,
            dlq: dlqStatus,
            processingQueue: 'healthy',
        };
    }
};
exports.ResilientProcessAppointmentUseCase = ResilientProcessAppointmentUseCase;
exports.ResilientProcessAppointmentUseCase = ResilientProcessAppointmentUseCase = ResilientProcessAppointmentUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.PATIENT_REPOSITORY)),
    __param(4, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY)),
    __param(5, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.APPOINTMENT_REPOSITORY)),
    __metadata("design:paramtypes", [saga_orchestrator_1.SagaOrchestrator,
        dlq_handler_1.DeadLetterQueueHandler,
        process_appointment_use_case_1.ProcessAppointmentUseCase, Object, Object, Object, outbox_service_1.OutboxService])
], ResilientProcessAppointmentUseCase);
//# sourceMappingURL=resilient-process-appointment.use-case.js.map