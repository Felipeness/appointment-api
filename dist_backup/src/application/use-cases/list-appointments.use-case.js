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
var ListAppointmentsUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAppointmentsUseCase = void 0;
const common_1 = require("@nestjs/common");
const paginated_response_dto_1 = require("../dtos/paginated-response.dto");
const injection_tokens_1 = require("../../shared/constants/injection-tokens");
let ListAppointmentsUseCase = ListAppointmentsUseCase_1 = class ListAppointmentsUseCase {
    appointmentRepository;
    logger = new common_1.Logger(ListAppointmentsUseCase_1.name);
    constructor(appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }
    async execute(query) {
        this.logger.log('Starting appointment listing', {
            page: query.page,
            limit: query.limit,
            filters: this.extractFilters(query),
        });
        try {
            const filters = this.extractFilters(query);
            const pagination = this.extractPagination(query);
            const result = await this.appointmentRepository.findManyWithPagination(filters, pagination);
            const appointmentDtos = result.data.map((appointment) => this.mapToResponseDto(appointment));
            const paginatedResponse = new paginated_response_dto_1.PaginatedResponseDto(appointmentDtos, result.total, result.page, result.limit);
            this.logger.log('Appointment listing completed successfully', {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: paginatedResponse.totalPages,
            });
            return paginatedResponse;
        }
        catch (error) {
            this.logger.error('Failed to list appointments', {
                error: error.message,
                stack: error.stack,
                query,
            });
            throw error;
        }
    }
    extractFilters(query) {
        const filters = {};
        if (query.patientId) {
            filters.patientId = query.patientId;
        }
        if (query.psychologistId) {
            filters.psychologistId = query.psychologistId;
        }
        if (query.status) {
            filters.status = query.status;
        }
        if (query.appointmentType) {
            filters.appointmentType = query.appointmentType;
        }
        if (query.startDate) {
            filters.startDate = new Date(query.startDate);
        }
        if (query.endDate) {
            filters.endDate = new Date(query.endDate);
        }
        return filters;
    }
    extractPagination(query) {
        return {
            page: query.page ?? 1,
            limit: query.limit ?? 20,
            sortBy: query.sortBy ?? 'scheduledAt',
            sortOrder: query.sortOrder ?? 'desc',
        };
    }
    mapToResponseDto(appointment) {
        return {
            id: appointment.id,
            patientId: appointment.patientId,
            psychologistId: appointment.psychologistId,
            scheduledAt: appointment.scheduledAt.toISOString(),
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
            cancelledAt: appointment.cancelledAt?.toISOString(),
            cancelledBy: appointment.cancelledBy,
            cancellationReason: appointment.cancellationReason,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
            confirmedAt: appointment.confirmedAt?.toISOString(),
            completedAt: appointment.completedAt?.toISOString(),
        };
    }
};
exports.ListAppointmentsUseCase = ListAppointmentsUseCase;
exports.ListAppointmentsUseCase = ListAppointmentsUseCase = ListAppointmentsUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(injection_tokens_1.INJECTION_TOKENS.APPOINTMENT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ListAppointmentsUseCase);
//# sourceMappingURL=list-appointments.use-case.js.map