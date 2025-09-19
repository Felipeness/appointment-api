import { Injectable, Logger, Inject } from '@nestjs/common';
import { ListAppointmentsQueryDto } from '../dtos/list-appointments-query.dto';
import { AppointmentResponseDto } from '../dtos/appointment-response.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import type {
  AppointmentRepository,
  ListAppointmentsFilters,
  PaginationOptions,
} from '../../domain/repositories/appointment.repository';
import { INJECTION_TOKENS } from '../../shared/constants/injection-tokens';
import { Appointment } from '../../domain/entities/appointment.entity';

@Injectable()
export class ListAppointmentsUseCase {
  private readonly logger = new Logger(ListAppointmentsUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(
    query: ListAppointmentsQueryDto,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    this.logger.log('Starting appointment listing', {
      page: query.page,
      limit: query.limit,
      filters: this.extractFilters(query),
    });

    try {
      const filters = this.extractFilters(query);
      const pagination = this.extractPagination(query);

      const result = await this.appointmentRepository.findManyWithPagination(
        filters,
        pagination,
      );

      const appointmentDtos = result.data.map((appointment) =>
        this.mapToResponseDto(appointment),
      );

      const paginatedResponse = new PaginatedResponseDto(
        appointmentDtos,
        result.total,
        result.page,
        result.limit,
      );

      this.logger.log('Appointment listing completed successfully', {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: paginatedResponse.totalPages,
      });

      return paginatedResponse;
    } catch (error) {
      this.logger.error('Failed to list appointments', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        query,
      });
      throw error;
    }
  }

  private extractFilters(
    query: ListAppointmentsQueryDto,
  ): ListAppointmentsFilters {
    const filters: ListAppointmentsFilters = {};

    if (
      query.patientId !== undefined &&
      query.patientId !== null &&
      query.patientId !== ''
    ) {
      filters.patientId = query.patientId;
    }

    if (
      query.psychologistId !== undefined &&
      query.psychologistId !== null &&
      query.psychologistId !== ''
    ) {
      filters.psychologistId = query.psychologistId;
    }

    if (query.status !== undefined && query.status !== null) {
      filters.status = query.status;
    }

    if (query.appointmentType !== undefined && query.appointmentType !== null) {
      filters.appointmentType = query.appointmentType;
    }

    if (
      query.startDate !== undefined &&
      query.startDate !== null &&
      query.startDate !== ''
    ) {
      filters.startDate = new Date(query.startDate);
    }

    if (
      query.endDate !== undefined &&
      query.endDate !== null &&
      query.endDate !== ''
    ) {
      filters.endDate = new Date(query.endDate);
    }

    return filters;
  }

  private extractPagination(
    query: ListAppointmentsQueryDto,
  ): PaginationOptions {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sortBy: query.sortBy ?? 'scheduledAt',
      sortOrder: query.sortOrder ?? 'desc',
    };
  }

  private mapToResponseDto(appointment: Appointment): AppointmentResponseDto {
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
}
