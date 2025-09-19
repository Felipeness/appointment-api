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
var ProcessAppointmentUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessAppointmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const date_fns_1 = require("date-fns");
const appointment_entity_1 = require("../../domain/entities/appointment.entity");
const patient_entity_1 = require("../../domain/entities/patient.entity");
const outbox_service_1 = require("../../infrastructure/database/outbox/outbox.service");
const injection_tokens_1 = require("../../shared/constants/injection-tokens");
const enums_1 = require("../../domain/entities/enums");
let ProcessAppointmentUseCase = ProcessAppointmentUseCase_1 = class ProcessAppointmentUseCase {
    appointmentRepository;
    patientRepository;
    psychologistRepository;
    outboxService;
    logger = new common_1.Logger(ProcessAppointmentUseCase_1.name);
    constructor(appointmentRepository, patientRepository, psychologistRepository, outboxService) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.psychologistRepository = psychologistRepository;
        this.outboxService = outboxService;
    }
    async execute(message) {
        try {
            const { appointmentId, psychologistId, scheduledAt, patientEmail, patientName, patientPhone, } = message;
            const scheduledDate = (0, date_fns_1.parseISO)(scheduledAt);
            let patient = await this.patientRepository.findByEmail(patientEmail);
            if (!patient) {
                patient = new patient_entity_1.Patient((0, uuid_1.v4)(), patientEmail, patientName, patientPhone);
                patient = await this.patientRepository.save(patient);
                this.logger.log(`Created new patient: ${patient.id}`);
            }
            const psychologist = await this.psychologistRepository.findById(psychologistId);
            if (!psychologist) {
                await this.declineAppointment(appointmentId, patient.id, psychologistId, scheduledDate, 'Psychologist not found');
                return;
            }
            if (!psychologist.isActive) {
                await this.declineAppointment(appointmentId, patient.id, psychologistId, scheduledDate, 'Psychologist is not active');
                return;
            }
            const existingAppointment = await this.appointmentRepository.findByPsychologistAndDate(psychologistId, scheduledDate);
            if (existingAppointment) {
                await this.declineAppointment(appointmentId, patient.id, psychologistId, scheduledDate, 'Time slot no longer available');
                return;
            }
            if (!psychologist.isAvailableAt(scheduledDate)) {
                await this.declineAppointment(appointmentId, patient.id, psychologistId, scheduledDate, 'Psychologist not available at requested time');
                return;
            }
            const confirmedAppointment = new appointment_entity_1.Appointment(appointmentId, patient.id, psychologistId, scheduledDate, message.duration ?? 60, message.appointmentType ??
                enums_1.AppointmentType.CONSULTATION, enums_1.AppointmentStatus.CONFIRMED, message.meetingType ?? enums_1.MeetingType.IN_PERSON, message.meetingUrl, message.meetingRoom, message.reason, message.notes, undefined, message.consultationFee, false, undefined, undefined, undefined, new Date(), new Date(), new Date(), undefined);
            await this.outboxService.saveEventInTransaction({
                aggregateId: appointmentId,
                aggregateType: 'Appointment',
                eventType: 'AppointmentConfirmed',
                eventData: {
                    appointmentId,
                    patientId: patient.id,
                    psychologistId,
                    scheduledAt: scheduledDate.toISOString(),
                    status: 'CONFIRMED',
                    confirmedAt: new Date().toISOString(),
                },
            }, async (prismaTransaction) => {
                await prismaTransaction.appointment.create({
                    data: {
                        id: confirmedAppointment.id,
                        patientId: confirmedAppointment.patientId,
                        psychologistId: confirmedAppointment.psychologistId,
                        scheduledAt: confirmedAppointment.scheduledAt,
                        duration: confirmedAppointment.duration,
                        appointmentType: confirmedAppointment.appointmentType,
                        status: confirmedAppointment.status,
                        meetingType: confirmedAppointment.meetingType,
                        meetingUrl: confirmedAppointment.meetingUrl,
                        meetingRoom: confirmedAppointment.meetingRoom,
                        reason: confirmedAppointment.reason,
                        notes: confirmedAppointment.notes,
                        privateNotes: confirmedAppointment.privateNotes,
                        consultationFee: confirmedAppointment.consultationFee,
                        isPaid: confirmedAppointment.isPaid,
                        createdAt: confirmedAppointment.createdAt,
                        updatedAt: confirmedAppointment.updatedAt,
                        confirmedAt: confirmedAppointment.confirmedAt,
                    },
                });
            });
            this.logger.log(`Appointment confirmed using Outbox Pattern: ${appointmentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to process appointment: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }
    async declineAppointment(appointmentId, patientId, psychologistId, scheduledDate, reason) {
        const declinedAppointment = new appointment_entity_1.Appointment(appointmentId, patientId, psychologistId, scheduledDate, 60, enums_1.AppointmentType.CONSULTATION, enums_1.AppointmentStatus.DECLINED, enums_1.MeetingType.IN_PERSON, undefined, undefined, undefined, undefined, undefined, undefined, false, undefined, undefined, undefined, new Date(), new Date(), undefined, undefined);
        await this.outboxService.saveEventInTransaction({
            aggregateId: appointmentId,
            aggregateType: 'Appointment',
            eventType: 'AppointmentDeclined',
            eventData: {
                appointmentId,
                patientId,
                psychologistId,
                scheduledAt: scheduledDate.toISOString(),
                status: 'DECLINED',
                declineReason: reason,
                declinedAt: new Date().toISOString(),
            },
        }, async (prismaTransaction) => {
            await prismaTransaction.appointment.create({
                data: {
                    id: declinedAppointment.id,
                    patientId: declinedAppointment.patientId,
                    psychologistId: declinedAppointment.psychologistId,
                    scheduledAt: declinedAppointment.scheduledAt,
                    duration: declinedAppointment.duration,
                    appointmentType: declinedAppointment.appointmentType,
                    status: declinedAppointment.status,
                    meetingType: declinedAppointment.meetingType,
                    createdAt: declinedAppointment.createdAt,
                    updatedAt: declinedAppointment.updatedAt,
                },
            });
        });
        this.logger.warn(`Appointment declined using Outbox Pattern: ${appointmentId} - ${reason}`);
        this.sendNotification(patientId, 'declined', reason);
    }
    sendNotification(patientId, status, message) {
        this.logger.log(`Notification sent to patient ${patientId}: ${status} - ${message}`);
    }
};
exports.ProcessAppointmentUseCase = ProcessAppointmentUseCase;
exports.ProcessAppointmentUseCase = ProcessAppointmentUseCase = ProcessAppointmentUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.APPOINTMENT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.PATIENT_REPOSITORY)),
    __param(2, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object, outbox_service_1.OutboxService])
], ProcessAppointmentUseCase);
//# sourceMappingURL=process-appointment.use-case.js.map