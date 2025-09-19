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
exports.PrismaAppointmentRepositoryAdapter = void 0;
const common_1 = require("@nestjs/common");
const appointment_aggregate_1 = require("../../../domain/aggregates/appointment.aggregate");
const appointment_id_vo_1 = require("../../../domain/value-objects/appointment-id.vo");
const patient_id_vo_1 = require("../../../domain/value-objects/patient-id.vo");
const psychologist_id_vo_1 = require("../../../domain/value-objects/psychologist-id.vo");
const enums_1 = require("../../../domain/entities/enums");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let PrismaAppointmentRepositoryAdapter = class PrismaAppointmentRepositoryAdapter {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(appointment) {
        const snapshot = appointment.toSnapshot();
        const prismaData = this.toPersistence(snapshot);
        await this.prisma.appointment.upsert({
            where: { id: snapshot.id.toString() },
            create: prismaData,
            update: {
                ...prismaData,
                updatedAt: new Date(),
            },
        });
        appointment.markEventsAsCommitted();
    }
    async findById(id) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: id.toString() },
        });
        return appointment ? this.toDomain(appointment) : null;
    }
    async findByPatientId(patientId) {
        const appointments = await this.prisma.appointment.findMany({
            where: { patientId: patientId.toString() },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map(appointment => this.toDomain(appointment));
    }
    async findByPsychologistId(psychologistId) {
        const appointments = await this.prisma.appointment.findMany({
            where: { psychologistId: psychologistId.toString() },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map(appointment => this.toDomain(appointment));
    }
    async findByStatus(status) {
        const prismaStatus = this.statusToPrisma(status);
        const appointments = await this.prisma.appointment.findMany({
            where: { status: prismaStatus },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map(appointment => this.toDomain(appointment));
    }
    async findConflictingAppointments(psychologistId, scheduledAt, duration, excludeAppointmentId) {
        const endTime = new Date(scheduledAt.getTime() + duration * 60000);
        const appointments = await this.prisma.appointment.findMany({
            where: {
                psychologistId: psychologistId.toString(),
                AND: [
                    {
                        OR: [
                            {
                                AND: [
                                    { scheduledAt: { lte: scheduledAt } },
                                    {
                                        scheduledAt: {
                                            gte: new Date(scheduledAt.getTime() - 60 * 60000)
                                        }
                                    },
                                ],
                            },
                            {
                                AND: [
                                    { scheduledAt: { gte: scheduledAt } },
                                    { scheduledAt: { lt: endTime } },
                                ],
                            },
                        ],
                    },
                    {
                        status: {
                            in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED],
                        },
                    },
                    ...(excludeAppointmentId ? [{ id: { not: excludeAppointmentId.toString() } }] : []),
                ],
            },
        });
        return appointments.map(appointment => this.toDomain(appointment));
    }
    async findUpcomingAppointments(limit = 50) {
        const appointments = await this.prisma.appointment.findMany({
            where: {
                scheduledAt: { gte: new Date() },
                status: {
                    in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED],
                },
            },
            orderBy: { scheduledAt: 'asc' },
            take: limit,
        });
        return appointments.map(appointment => this.toDomain(appointment));
    }
    async delete(id) {
        await this.prisma.appointment.delete({
            where: { id: id.toString() },
        });
    }
    toDomain(prismaAppointment) {
        const props = {
            id: appointment_id_vo_1.AppointmentId.fromString(prismaAppointment.id),
            patientId: patient_id_vo_1.PatientId.fromString(prismaAppointment.patientId),
            psychologistId: psychologist_id_vo_1.PsychologistId.fromString(prismaAppointment.psychologistId),
            scheduledAt: prismaAppointment.scheduledAt,
            duration: prismaAppointment.duration,
            appointmentType: this.appointmentTypeFromPrisma(prismaAppointment.appointmentType),
            status: this.statusFromPrisma(prismaAppointment.status),
            meetingType: this.meetingTypeFromPrisma(prismaAppointment.meetingType),
            meetingUrl: prismaAppointment.meetingUrl || undefined,
            meetingRoom: prismaAppointment.meetingRoom || undefined,
            reason: prismaAppointment.reason || undefined,
            notes: prismaAppointment.notes || undefined,
            privateNotes: prismaAppointment.privateNotes || undefined,
            consultationFee: prismaAppointment.consultationFee ? Number(prismaAppointment.consultationFee) : undefined,
            isPaid: prismaAppointment.isPaid,
            cancelledAt: prismaAppointment.cancelledAt || undefined,
            cancelledBy: prismaAppointment.cancelledBy || undefined,
            cancellationReason: prismaAppointment.cancellationReason || undefined,
            createdAt: prismaAppointment.createdAt,
            updatedAt: prismaAppointment.updatedAt,
            confirmedAt: prismaAppointment.confirmedAt || undefined,
            completedAt: prismaAppointment.completedAt || undefined,
        };
        return appointment_aggregate_1.Appointment.reconstitute(props, 1);
    }
    toPersistence(props) {
        return {
            id: props.id.toString(),
            patientId: props.patientId.toString(),
            psychologistId: props.psychologistId.toString(),
            scheduledAt: props.scheduledAt,
            duration: props.duration,
            appointmentType: this.appointmentTypeToPrisma(props.appointmentType),
            status: this.statusToPrisma(props.status),
            meetingType: this.meetingTypeToPrisma(props.meetingType),
            meetingUrl: props.meetingUrl || null,
            meetingRoom: props.meetingRoom || null,
            reason: props.reason || null,
            notes: props.notes || null,
            privateNotes: props.privateNotes || null,
            consultationFee: props.consultationFee ? new (require('@prisma/client').Prisma.Decimal)(props.consultationFee) : null,
            isPaid: props.isPaid,
            cancelledAt: props.cancelledAt || null,
            cancelledBy: props.cancelledBy || null,
            cancellationReason: props.cancellationReason || null,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            confirmedAt: props.confirmedAt || null,
            completedAt: props.completedAt || null,
        };
    }
    statusFromPrisma(status) {
        const statusMap = {
            PENDING: enums_1.AppointmentStatus.PENDING,
            CONFIRMED: enums_1.AppointmentStatus.CONFIRMED,
            CANCELLED: enums_1.AppointmentStatus.CANCELLED,
            COMPLETED: enums_1.AppointmentStatus.COMPLETED,
            DECLINED: enums_1.AppointmentStatus.DECLINED,
            NO_SHOW: enums_1.AppointmentStatus.NO_SHOW,
            RESCHEDULED: enums_1.AppointmentStatus.RESCHEDULED,
        };
        return statusMap[status];
    }
    statusToPrisma(status) {
        const statusMap = {
            [enums_1.AppointmentStatus.PENDING]: client_1.AppointmentStatus.PENDING,
            [enums_1.AppointmentStatus.CONFIRMED]: client_1.AppointmentStatus.CONFIRMED,
            [enums_1.AppointmentStatus.CANCELLED]: client_1.AppointmentStatus.CANCELLED,
            [enums_1.AppointmentStatus.COMPLETED]: client_1.AppointmentStatus.COMPLETED,
            [enums_1.AppointmentStatus.DECLINED]: client_1.AppointmentStatus.DECLINED,
            [enums_1.AppointmentStatus.NO_SHOW]: client_1.AppointmentStatus.NO_SHOW,
            [enums_1.AppointmentStatus.RESCHEDULED]: client_1.AppointmentStatus.RESCHEDULED,
        };
        return statusMap[status];
    }
    appointmentTypeFromPrisma(type) {
        return type;
    }
    appointmentTypeToPrisma(type) {
        return type;
    }
    meetingTypeFromPrisma(type) {
        return type;
    }
    meetingTypeToPrisma(type) {
        return type;
    }
};
exports.PrismaAppointmentRepositoryAdapter = PrismaAppointmentRepositoryAdapter;
exports.PrismaAppointmentRepositoryAdapter = PrismaAppointmentRepositoryAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAppointmentRepositoryAdapter);
//# sourceMappingURL=prisma-appointment.repository.adapter.js.map