import { Injectable } from '@nestjs/common';
import {
  AppointmentRepository,
  ListAppointmentsFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/repositories/appointment.repository';
import { Appointment } from '../../../domain/entities/appointment.entity';
import {
  AppointmentStatus,
  AppointmentType,
  MeetingType,
} from '../../../domain/entities/enums';
import { PrismaService } from '../prisma.service';
import {
  AppointmentStatus as PrismaAppointmentStatus,
  AppointmentType as PrismaAppointmentType,
  MeetingType as PrismaMeetingType,
  Appointment as PrismaAppointment,
} from '@prisma/client';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    return appointment ? this.toDomain(appointment) : null;
  }

  async findByPsychologistAndDate(
    psychologistId: string,
    scheduledAt: Date,
  ): Promise<Appointment | null> {
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

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map((appointment) => this.toDomain(appointment));
  }

  async findByPsychologistId(psychologistId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { psychologistId },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map((appointment) => this.toDomain(appointment));
  }

  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { status: status as PrismaAppointmentStatus },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map((appointment) => this.toDomain(appointment));
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
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

  async findManyWithPagination(
    filters?: ListAppointmentsFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Appointment>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy ?? 'scheduledAt';
    const sortOrder = pagination?.sortOrder ?? 'desc';

    // Build where clause
    const where: any = {};
    
    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    
    if (filters?.psychologistId) {
      where.psychologistId = filters.psychologistId;
    }
    
    if (filters?.status) {
      where.status = filters.status as PrismaAppointmentStatus;
    }
    
    if (filters?.appointmentType) {
      where.appointmentType = filters.appointmentType as PrismaAppointmentType;
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

    // Execute queries in parallel
    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const domainAppointments = appointments.map((appointment) =>
      this.toDomain(appointment),
    );

    return {
      data: domainAppointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const data = this.toPersistence(appointment);
    const saved = await this.prisma.appointment.create({
      data: data as unknown as Parameters<
        typeof this.prisma.appointment.create
      >[0]['data'],
    });
    return this.toDomain(saved);
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const data = this.toPersistence(appointment);
    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data,
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  private toDomain(appointment: PrismaAppointment): Appointment {
    return new Appointment(
      appointment.id,
      appointment.patientId,
      appointment.psychologistId,
      appointment.scheduledAt,
      appointment.duration,
      appointment.appointmentType as AppointmentType,
      appointment.status as AppointmentStatus,
      appointment.meetingType as MeetingType,
      appointment.meetingUrl || undefined,
      appointment.meetingRoom || undefined,
      appointment.reason || undefined,
      appointment.notes || undefined,
      appointment.privateNotes || undefined,
      appointment.consultationFee
        ? Number(appointment.consultationFee)
        : undefined,
      appointment.isPaid,
      appointment.cancelledAt || undefined,
      appointment.cancelledBy || undefined,
      appointment.cancellationReason || undefined,
      appointment.createdAt,
      appointment.updatedAt,
      appointment.confirmedAt || undefined,
      appointment.completedAt || undefined,
    );
  }

  private toPersistence(appointment: Appointment): Record<string, unknown> {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      psychologistId: appointment.psychologistId,
      scheduledAt: appointment.scheduledAt,
      duration: appointment.duration,
      appointmentType: appointment.appointmentType as PrismaAppointmentType,
      status: appointment.status as PrismaAppointmentStatus,
      meetingType: appointment.meetingType as PrismaMeetingType,
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
}
