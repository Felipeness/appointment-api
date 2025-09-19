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
var AppointmentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const enterprise_schedule_appointment_use_case_1 = require("../../application/use-cases/enterprise-schedule-appointment.use-case");
const list_appointments_use_case_1 = require("../../application/use-cases/list-appointments.use-case");
const create_appointment_dto_1 = require("../../application/dtos/create-appointment.dto");
const list_appointments_query_dto_1 = require("../../application/dtos/list-appointments-query.dto");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
const idempotency_interceptor_1 = require("../../common/interceptors/idempotency.interceptor");
const rate_limit_guard_1 = require("../../common/guards/rate-limit.guard");
let AppointmentsController = AppointmentsController_1 = class AppointmentsController {
    enterpriseScheduleUseCase;
    listAppointmentsUseCase;
    logger = new common_1.Logger(AppointmentsController_1.name);
    constructor(enterpriseScheduleUseCase, listAppointmentsUseCase) {
        this.enterpriseScheduleUseCase = enterpriseScheduleUseCase;
        this.listAppointmentsUseCase = listAppointmentsUseCase;
    }
    async listAppointments(query) {
        this.logger.log('Listing appointments', {
            page: query.page,
            limit: query.limit,
            filters: {
                patientId: query.patientId,
                psychologistId: query.psychologistId,
                status: query.status,
                appointmentType: query.appointmentType,
                dateRange: query.startDate && query.endDate ? `${query.startDate} - ${query.endDate}` : undefined,
            },
        });
        return await this.listAppointmentsUseCase.execute(query);
    }
    async scheduleAppointment(createAppointmentDto, traceId, userId, priority) {
        const startTime = Date.now();
        this.logger.log(`Received enterprise appointment request`, {
            psychologistId: createAppointmentDto.psychologistId,
            patientEmail: createAppointmentDto.patientEmail,
            scheduledAt: createAppointmentDto.scheduledAt,
            priority: priority ?? 'auto-determined',
            traceId,
            userId,
        });
        try {
            const result = await this.enterpriseScheduleUseCase.execute(createAppointmentDto, {
                priority,
                traceId,
                userId,
            });
            const processingTime = Date.now() - startTime;
            this.logger.log(`Enterprise appointment request processed successfully`, {
                appointmentId: result.appointmentId,
                status: result.status,
                priority: result.priority,
                traceId: result.traceId,
                processingTimeMs: processingTime,
            });
            return {
                ...result,
                message: result.status === 'queued'
                    ? 'Appointment request queued for enterprise processing'
                    : 'Appointment request failed validation',
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Enterprise appointment request failed`, {
                psychologistId: createAppointmentDto.psychologistId,
                error: errorMessage,
                traceId,
                processingTimeMs: processingTime,
                stack: errorStack,
            });
            throw error;
        }
    }
    async scheduleAppointmentsBatch(batchRequest, traceId, priority) {
        const startTime = Date.now();
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.logger.log(`Received enterprise batch appointment request`, {
            batchId,
            appointmentCount: batchRequest.appointments.length,
            priority: priority ?? 'auto-determined',
            traceId,
        });
        try {
            const results = await this.enterpriseScheduleUseCase.executeBatch(batchRequest.appointments, {
                priority,
                traceId,
                batchId,
            });
            const processingTime = Date.now() - startTime;
            const successful = results.filter((r) => r.status === 'queued').length;
            const failed = results.filter((r) => r.status === 'failed').length;
            this.logger.log(`Enterprise batch appointment request processed`, {
                batchId,
                totalRequests: results.length,
                successful,
                failed,
                processingTimeMs: processingTime,
            });
            return {
                batchId,
                totalRequests: results.length,
                successful,
                failed,
                results,
                message: `Batch processed: ${successful} queued, ${failed} failed`,
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Enterprise batch appointment request failed`, {
                batchId,
                error: errorMessage,
                traceId,
                processingTimeMs: processingTime,
            });
            throw error;
        }
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_guard_1.RateLimit)({ points: 30, duration: 60 }),
    (0, swagger_1.ApiOperation)({
        summary: 'List appointments',
        description: 'Retrieve a paginated list of appointments with optional filtering by patient, psychologist, status, type, and date range.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        description: 'Page number (starts at 1)',
        required: false,
        type: Number,
        example: 1,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        description: 'Number of items per page (max 100)',
        required: false,
        type: Number,
        example: 20,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'patientId',
        description: 'Filter by patient ID',
        required: false,
        type: String,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'psychologistId',
        description: 'Filter by psychologist ID',
        required: false,
        type: String,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        description: 'Filter by appointment status',
        required: false,
        enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'appointmentType',
        description: 'Filter by appointment type',
        required: false,
        enum: ['CONSULTATION', 'THERAPY_SESSION', 'EMERGENCY', 'FOLLOW_UP'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        description: 'Filter appointments from this date (ISO format)',
        required: false,
        type: String,
        example: '2025-01-01T00:00:00.000Z',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        description: 'Filter appointments until this date (ISO format)',
        required: false,
        type: String,
        example: '2025-12-31T23:59:59.999Z',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sortBy',
        description: 'Field to sort by',
        required: false,
        enum: ['scheduledAt', 'createdAt', 'updatedAt', 'status'],
        example: 'scheduledAt',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sortOrder',
        description: 'Sort order',
        required: false,
        enum: ['asc', 'desc'],
        example: 'desc',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Appointments retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AppointmentResponseDto' },
                },
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                totalPages: { type: 'number', example: 5 },
                hasPreviousPage: { type: 'boolean', example: false },
                hasNextPage: { type: 'boolean', example: true },
            },
        },
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_appointments_query_dto_1.ListAppointmentsQueryDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "listAppointments", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, idempotency_decorator_1.Idempotent)({ ttl: 3600, scope: 'user', validateParameters: true }),
    (0, rate_limit_guard_1.RateLimit)({ points: 10, duration: 60, blockDuration: 300 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Schedule a new appointment (Enterprise)',
        description: 'Creates a new appointment request with enterprise features including priority processing, distributed tracing, and intelligent queueing. The appointment will be validated and confirmed/declined asynchronously.',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Appointment details',
        type: create_appointment_dto_1.CreateAppointmentDto,
    }),
    (0, swagger_1.ApiHeader)({
        name: 'x-trace-id',
        description: 'Optional trace ID for distributed tracing',
        required: false,
    }),
    (0, swagger_1.ApiHeader)({
        name: 'x-user-id',
        description: 'Optional user ID for auditing',
        required: false,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'priority',
        description: 'Message priority: high (immediate), normal (5s delay), low (10s delay)',
        required: false,
        enum: ['high', 'normal', 'low'],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.ACCEPTED,
        description: 'Appointment request accepted and queued for enterprise processing',
        schema: {
            type: 'object',
            properties: {
                appointmentId: {
                    type: 'string',
                    example: 'clx123456789',
                    description: 'Generated appointment ID',
                },
                status: {
                    type: 'string',
                    example: 'queued',
                    description: 'Current status of the appointment request',
                },
                queuedAt: {
                    type: 'string',
                    example: '2024-01-15T10:00:00.000Z',
                    description: 'Timestamp when request was queued',
                },
                estimatedProcessingTime: {
                    type: 'string',
                    example: '2024-01-15T10:05:00.000Z',
                    description: 'Estimated processing completion time based on priority',
                },
                traceId: {
                    type: 'string',
                    example: 'trace_1234567890_abc123',
                    description: 'Distributed tracing ID for monitoring',
                },
                priority: {
                    type: 'string',
                    example: 'normal',
                    description: 'Assigned priority level',
                },
                message: {
                    type: 'string',
                    example: 'Appointment request queued for enterprise processing',
                    description: 'Status message',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid request data or business rule violation',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'Appointments must be scheduled at least 24 hours in advance',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Psychologist not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: { type: 'string', example: 'Psychologist not found' },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-trace-id')),
    __param(2, (0, common_1.Headers)('x-user-id')),
    __param(3, (0, common_1.Query)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_appointment_dto_1.CreateAppointmentDto, String, String, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "scheduleAppointment", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, idempotency_decorator_1.Idempotent)({ ttl: 3600, scope: 'user', validateParameters: true }),
    (0, rate_limit_guard_1.RateLimit)({ points: 5, duration: 300, blockDuration: 600 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Schedule multiple appointments (Enterprise Batch)',
        description: 'Creates multiple appointment requests in a single batch operation with enterprise features. Optimized for high-volume scenarios.',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Array of appointment details',
        schema: {
            type: 'object',
            properties: {
                appointments: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/CreateAppointmentDto' },
                },
            },
        },
    }),
    (0, swagger_1.ApiHeader)({
        name: 'x-trace-id',
        description: 'Optional trace ID for distributed tracing',
        required: false,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'priority',
        description: 'Batch priority level',
        required: false,
        enum: ['high', 'normal', 'low'],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.ACCEPTED,
        description: 'Batch appointment requests processed',
        schema: {
            type: 'object',
            properties: {
                batchId: { type: 'string' },
                totalRequests: { type: 'number' },
                successful: { type: 'number' },
                failed: { type: 'number' },
                results: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            appointmentId: { type: 'string' },
                            status: { type: 'string' },
                            traceId: { type: 'string' },
                        },
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-trace-id')),
    __param(2, (0, common_1.Query)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "scheduleAppointmentsBatch", null);
exports.AppointmentsController = AppointmentsController = AppointmentsController_1 = __decorate([
    (0, swagger_1.ApiTags)('appointments'),
    (0, common_1.Controller)('appointments'),
    __metadata("design:paramtypes", [enterprise_schedule_appointment_use_case_1.EnterpriseScheduleAppointmentUseCase,
        list_appointments_use_case_1.ListAppointmentsUseCase])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map