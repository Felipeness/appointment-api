import { Injectable } from '@nestjs/common';
import { AppointmentRepositoryPort } from '../../../application/ports/appointment.repository.port';
import { Appointment, AppointmentProps } from '../../../domain/aggregates/appointment.aggregate';
import { AppointmentId } from '../../../domain/value-objects/appointment-id.vo';
import { PatientId } from '../../../domain/value-objects/patient-id.vo';
import { PsychologistId } from '../../../domain/value-objects/psychologist-id.vo';
import { AppointmentStatus } from '../../../domain/entities/enums';
import { PrismaService } from '../prisma.service';
import {
  AppointmentStatus as PrismaAppointmentStatus,
  AppointmentType as PrismaAppointmentType,
  MeetingType as PrismaMeetingType,
  Appointment as PrismaAppointment,
} from '@prisma/client';

@Injectable()
export class PrismaAppointmentRepositoryAdapter implements AppointmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(appointment: Appointment): Promise<void> {
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

    // Mark domain events as committed
    appointment.markEventsAsCommitted();
  }

  async findById(id: AppointmentId): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: id.toString() },
    });

    return appointment ? this.toDomain(appointment) : null;
  }

  async findByPatientId(patientId: PatientId): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId: patientId.toString() },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map(appointment => this.toDomain(appointment));
  }

  async findByPsychologistId(psychologistId: PsychologistId): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { psychologistId: psychologistId.toString() },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map(appointment => this.toDomain(appointment));
  }

  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    const prismaStatus = this.statusToPrisma(status);
    const appointments = await this.prisma.appointment.findMany({
      where: { status: prismaStatus },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map(appointment => this.toDomain(appointment));
  }

  async findConflictingAppointments(
    psychologistId: PsychologistId,
    scheduledAt: Date,
    duration: number,
    excludeAppointmentId?: AppointmentId,
  ): Promise<Appointment[]> {
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
                      gte: new Date(scheduledAt.getTime() - 60 * 60000) // 1 hour buffer
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
              in: [PrismaAppointmentStatus.PENDING, PrismaAppointmentStatus.CONFIRMED],
            },
          },
          ...(excludeAppointmentId ? [{ id: { not: excludeAppointmentId.toString() } }] : []),
        ],
      },
    });

    return appointments.map(appointment => this.toDomain(appointment));
  }

  async findUpcomingAppointments(limit = 50): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: {
          in: [PrismaAppointmentStatus.PENDING, PrismaAppointmentStatus.CONFIRMED],
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });

    return appointments.map(appointment => this.toDomain(appointment));
  }

  async delete(id: AppointmentId): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id: id.toString() },
    });
  }

  private toDomain(prismaAppointment: PrismaAppointment): Appointment {
    const props: AppointmentProps = {
      id: AppointmentId.fromString(prismaAppointment.id),
      patientId: PatientId.fromString(prismaAppointment.patientId),
      psychologistId: PsychologistId.fromString(prismaAppointment.psychologistId),
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

    return Appointment.reconstitute(props, 1); // Version would come from event store in full implementation
  }

  private toPersistence(props: AppointmentProps): Omit<PrismaAppointment, 'id'> & { id: string } {
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

  // Mapping helpers
  private statusFromPrisma(status: PrismaAppointmentStatus): AppointmentStatus {
    const statusMap: Record<PrismaAppointmentStatus, AppointmentStatus> = {
      PENDING: AppointmentStatus.PENDING,
      CONFIRMED: AppointmentStatus.CONFIRMED,
      CANCELLED: AppointmentStatus.CANCELLED,
      COMPLETED: AppointmentStatus.COMPLETED,
      DECLINED: AppointmentStatus.DECLINED,
      NO_SHOW: AppointmentStatus.NO_SHOW,
      RESCHEDULED: AppointmentStatus.RESCHEDULED,
    };
    return statusMap[status];
  }

  private statusToPrisma(status: AppointmentStatus): PrismaAppointmentStatus {
    const statusMap: Record<AppointmentStatus, PrismaAppointmentStatus> = {
      [AppointmentStatus.PENDING]: PrismaAppointmentStatus.PENDING,
      [AppointmentStatus.CONFIRMED]: PrismaAppointmentStatus.CONFIRMED,
      [AppointmentStatus.CANCELLED]: PrismaAppointmentStatus.CANCELLED,
      [AppointmentStatus.COMPLETED]: PrismaAppointmentStatus.COMPLETED,
      [AppointmentStatus.DECLINED]: PrismaAppointmentStatus.DECLINED,
      [AppointmentStatus.NO_SHOW]: PrismaAppointmentStatus.NO_SHOW,
      [AppointmentStatus.RESCHEDULED]: PrismaAppointmentStatus.RESCHEDULED,
    };
    return statusMap[status];
  }

  private appointmentTypeFromPrisma(type: PrismaAppointmentType) {
    // Implement mapping logic based on your enum definitions
    return type as any; // Temporary - needs proper mapping
  }

  private appointmentTypeToPrisma(type: any): PrismaAppointmentType {
    // Implement mapping logic based on your enum definitions
    return type as PrismaAppointmentType; // Temporary - needs proper mapping
  }

  private meetingTypeFromPrisma(type: PrismaMeetingType) {
    // Implement mapping logic based on your enum definitions
    return type as any; // Temporary - needs proper mapping
  }

  private meetingTypeToPrisma(type: any): PrismaMeetingType {
    // Implement mapping logic based on your enum definitions
    return type as PrismaMeetingType; // Temporary - needs proper mapping
  }
}