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
exports.PrismaAppointmentRepository = void 0;
const common_1 = require("@nestjs/common");
const appointment_entity_1 = require("../../../domain/entities/appointment.entity");
const prisma_service_1 = require("../prisma.service");
let PrismaAppointmentRepository = class PrismaAppointmentRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
        });
        return appointment ? this.toDomain(appointment) : null;
    }
    async findByPsychologistAndDate(psychologistId, scheduledAt) {
        const appointment = await this.prisma.appointment.findUnique({
            where: {
                psychologistId_scheduledAt: {
                    psychologistId,
                    scheduledAt,
                },
            },
        });
        return appointment ? this.toDomain(appointment) : null;
    }
    async findByPatientId(patientId) {
        const appointments = await this.prisma.appointment.findMany({
            where: { patientId },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map((appointment) => this.toDomain(appointment));
    }
    async findByPsychologistId(psychologistId) {
        const appointments = await this.prisma.appointment.findMany({
            where: { psychologistId },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map((appointment) => this.toDomain(appointment));
    }
    async findByStatus(status) {
        const appointments = await this.prisma.appointment.findMany({
            where: { status: status },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map((appointment) => this.toDomain(appointment));
    }
    async findByDateRange(startDate, endDate) {
        const appointments = await this.prisma.appointment.findMany({
            where: {
                scheduledAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
        return appointments.map((appointment) => this.toDomain(appointment));
    }
    async findManyWithPagination(filters, pagination) {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 20;
        const skip = (page - 1) * limit;
        const sortBy = pagination?.sortBy ?? 'scheduledAt';
        const sortOrder = pagination?.sortOrder ?? 'desc';
        const where = {};
        if (filters?.patientId) {
            where.patientId = filters.patientId;
        }
        if (filters?.psychologistId) {
            where.psychologistId = filters.psychologistId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.appointmentType) {
            where.appointmentType = filters.appointmentType;
        }
        if (filters?.startDate || filters?.endDate) {
            where.scheduledAt = {};
            if (filters.startDate) {
                where.scheduledAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.scheduledAt.lte = filters.endDate;
            }
        }
        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.appointment.count({ where }),
        ]);
        const domainAppointments = appointments.map((appointment) => this.toDomain(appointment));
        return {
            data: domainAppointments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async save(appointment) {
        const data = this.toPersistence(appointment);
        const saved = await this.prisma.appointment.create({
            data: data,
        });
        return this.toDomain(saved);
    }
    async update(appointment) {
        const data = this.toPersistence(appointment);
        const updated = await this.prisma.appointment.update({
            where: { id: appointment.id },
            data,
        });
        return this.toDomain(updated);
    }
    async delete(id) {
        await this.prisma.appointment.delete({
            where: { id },
        });
    }
    toDomain(appointment) {
        return new appointment_entity_1.Appointment(appointment.id, appointment.patientId, appointment.psychologistId, appointment.scheduledAt, appointment.duration, appointment.appointmentType, appointment.status, appointment.meetingType, appointment.meetingUrl || undefined, appointment.meetingRoom || undefined, appointment.reason || undefined, appointment.notes || undefined, appointment.privateNotes || undefined, appointment.consultationFee
            ? Number(appointment.consultationFee)
            : undefined, appointment.isPaid, appointment.cancelledAt || undefined, appointment.cancelledBy || undefined, appointment.cancellationReason || undefined, appointment.createdAt, appointment.updatedAt, appointment.confirmedAt || undefined, appointment.completedAt || undefined);
    }
    toPersistence(appointment) {
        return {
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
            cancelledAt: appointment.cancelledAt,
            cancelledBy: appointment.cancelledBy,
            cancellationReason: appointment.cancellationReason,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
            confirmedAt: appointment.confirmedAt,
            completedAt: appointment.completedAt,
        };
    }
};
exports.PrismaAppointmentRepository = PrismaAppointmentRepository;
exports.PrismaAppointmentRepository = PrismaAppointmentRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAppointmentRepository);
//# sourceMappingURL=prisma-appointment.repository.js.map