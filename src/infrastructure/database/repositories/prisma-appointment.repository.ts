import { Injectable } from '@nestjs/common';
import { AppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { AppointmentStatus, AppointmentType, MeetingType } from '../../../domain/entities/enums';
import { PrismaService } from '../prisma.service';
import { AppointmentStatus as PrismaAppointmentStatus, AppointmentType as PrismaAppointmentType, MeetingType as PrismaMeetingType } from '@prisma/client';

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
    scheduledAt: Date
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

    return appointments.map(this.toDomain);
  }

  async findByPsychologistId(psychologistId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { psychologistId },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map(this.toDomain);
  }

  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { status: status as PrismaAppointmentStatus },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map(this.toDomain);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map(this.toDomain);
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const data = this.toPersistence(appointment);
    const saved = await this.prisma.appointment.create({ data });
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

  private toDomain(appointment: any): Appointment {
    return new Appointment(
      appointment.id,
      appointment.patientId,
      appointment.psychologistId,
      appointment.scheduledAt,
      appointment.duration,
      appointment.appointmentType as AppointmentType,
      appointment.status as AppointmentStatus,
      appointment.meetingType as MeetingType,
      appointment.meetingUrl,
      appointment.meetingRoom,
      appointment.reason,
      appointment.notes,
      appointment.privateNotes,
      appointment.consultationFee,
      appointment.isPaid,
      appointment.cancelledAt,
      appointment.cancelledBy,
      appointment.cancellationReason,
      appointment.createdAt,
      appointment.updatedAt,
      appointment.confirmedAt,
      appointment.completedAt
    );
  }

  private toPersistence(appointment: Appointment): any {
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