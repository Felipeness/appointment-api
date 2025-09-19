import { EnterpriseScheduleAppointmentUseCase } from '../../application/use-cases/enterprise-schedule-appointment.use-case';
import { ListAppointmentsUseCase } from '../../application/use-cases/list-appointments.use-case';
import { CreateAppointmentDto } from '../../application/dtos/create-appointment.dto';
import { ListAppointmentsQueryDto } from '../../application/dtos/list-appointments-query.dto';
import { AppointmentResponseDto } from '../../application/dtos/appointment-response.dto';
import { PaginatedResponseDto } from '../../application/dtos/paginated-response.dto';
export declare class AppointmentsController {
    private readonly enterpriseScheduleUseCase;
    private readonly listAppointmentsUseCase;
    private readonly logger;
    constructor(enterpriseScheduleUseCase: EnterpriseScheduleAppointmentUseCase, listAppointmentsUseCase: ListAppointmentsUseCase);
    listAppointments(query: ListAppointmentsQueryDto): Promise<PaginatedResponseDto<AppointmentResponseDto>>;
    scheduleAppointment(createAppointmentDto: CreateAppointmentDto, traceId?: string, userId?: string, priority?: 'high' | 'normal' | 'low'): Promise<{
        message: string;
        appointmentId: string;
        status: "queued" | "failed";
        queuedAt: string;
        estimatedProcessingTime?: string;
        traceId: string;
        priority: "high" | "normal" | "low";
    }>;
    scheduleAppointmentsBatch(batchRequest: {
        appointments: CreateAppointmentDto[];
    }, traceId?: string, priority?: 'high' | 'normal' | 'low'): Promise<{
        batchId: string;
        totalRequests: number;
        successful: number;
        failed: number;
        results: import("../../application/use-cases/enterprise-schedule-appointment.use-case").EnterpriseScheduleResult[];
        message: string;
    }>;
}
