import { ListAppointmentsQueryDto } from '../dtos/list-appointments-query.dto';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import type { AppointmentRepository } from '../../domain/repositories/appointment.repository';
export declare class ListAppointmentsUseCase {
    private readonly appointmentRepository;
    private readonly logger;
    constructor(appointmentRepository: AppointmentRepository);
    execute(query: ListAppointmentsQueryDto): Promise<PaginatedResponseDto<AppointmentResponseDto>>;
    private extractFilters;
    private extractPagination;
    private mapToResponseDto;
}
