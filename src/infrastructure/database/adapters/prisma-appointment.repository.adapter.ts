import { Injectable } from '@nestjs/common';
import { AppointmentRepositoryPort } from '../../../application/ports/appointment.repository.port';
import {
  Appointment,
  AppointmentProps,
} from '../../../domain/aggregates/appointment.aggregate';
import { AppointmentId } from '../../../domain/value-objects/appointment-id.vo';
import { PatientId } from '../../../domain/value-objects/patient-id.vo';
import { PsychologistId } from '../../../domain/value-objects/psychologist-id.vo';
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
  Prisma,
} from '@prisma/client';

@Injectable()
export class PrismaAppointmentRepositoryAdapter
  implements AppointmentRepositoryPort
{
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

    return appointments.map((appointment) => this.toDomain(appointment));
  }

  async findByPsychologistId(
    psychologistId: PsychologistId,
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { psychologistId: psychologistId.toString() },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map((appointment) => this.toDomain(appointment));
  }

  async findByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    const prismaStatus = this.statusToPrisma(status);
    const appointments = await this.prisma.appointment.findMany({
      where: { status: prismaStatus },
      orderBy: { scheduledAt: 'asc' },
    });

    return appointments.map((appointment) => this.toDomain(appointment));
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
                      gte: new Date(scheduledAt.getTime() - 60 * 60000), // 1 hour buffer
                    },
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
              in: [
                PrismaAppointmentStatus.PENDING,
                PrismaAppointmentStatus.CONFIRMED,
              ],
            },
          },
          ...(excludeAppointmentId
            ? [{ id: { not: excludeAppointmentId.toString() } }]
            : []),
        ],
      },
    });

    return appointments.map((appointment) => this.toDomain(appointment));
  }

  async findUpcomingAppointments(limit = 50): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: {
          in: [
            PrismaAppointmentStatus.PENDING,
            PrismaAppointmentStatus.CONFIRMED,
          ],
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });

    return appointments.map((appointment) => this.toDomain(appointment));
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
      psychologistId: PsychologistId.fromString(
        prismaAppointment.psychologistId,
      ),
      scheduledAt: prismaAppointment.scheduledAt,
      duration: prismaAppointment.duration,
      appointmentType: this.appointmentTypeFromPrisma(
        prismaAppointment.appointmentType,
      ),
      status: this.statusFromPrisma(prismaAppointment.status),
      meetingType: this.meetingTypeFromPrisma(prismaAppointment.meetingType),
      meetingUrl: prismaAppointment.meetingUrl ?? undefined,
      meetingRoom: prismaAppointment.meetingRoom ?? undefined,
      reason: prismaAppointment.reason ?? undefined,
      notes: prismaAppointment.notes ?? undefined,
      privateNotes: prismaAppointment.privateNotes ?? undefined,
      consultationFee: prismaAppointment.consultationFee
        ? Number(prismaAppointment.consultationFee)
        : undefined,
      isPaid: prismaAppointment.isPaid,
      cancelledAt: prismaAppointment.cancelledAt ?? undefined,
      cancelledBy: prismaAppointment.cancelledBy ?? undefined,
      cancellationReason: prismaAppointment.cancellationReason ?? undefined,
      createdAt: prismaAppointment.createdAt,
      updatedAt: prismaAppointment.updatedAt,
      confirmedAt: prismaAppointment.confirmedAt ?? undefined,
      completedAt: prismaAppointment.completedAt ?? undefined,
    };

    return Appointment.reconstitute(props, 1);
  }

  private toPersistence(
    props: AppointmentProps,
  ): Omit<PrismaAppointment, 'id'> & { id: string } {
    return {
      id: props.id.toString(),
      patientId: props.patientId.toString(),
      psychologistId: props.psychologistId.toString(),
      scheduledAt: props.scheduledAt,
      duration: props.duration,
      appointmentType: this.appointmentTypeToPrisma(props.appointmentType),
      status: this.statusToPrisma(props.status),
      meetingType: this.meetingTypeToPrisma(props.meetingType),
      meetingUrl: props.meetingUrl ?? null,
      meetingRoom: props.meetingRoom ?? null,
      reason: props.reason ?? null,
      notes: props.notes ?? null,
      privateNotes: props.privateNotes ?? null,
      consultationFee: props.consultationFee
        ? new Prisma.Decimal(props.consultationFee)
        : null,
      isPaid: props.isPaid,
      cancelledAt: props.cancelledAt ?? null,
      cancelledBy: props.cancelledBy ?? null,
      cancellationReason: props.cancellationReason ?? null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      confirmedAt: props.confirmedAt ?? null,
      completedAt: props.completedAt ?? null,
    };
  }

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

  private appointmentTypeFromPrisma(
    type: PrismaAppointmentType,
  ): AppointmentType {
    const typeMap: Record<PrismaAppointmentType, AppointmentType> = {
      [PrismaAppointmentType.CONSULTATION]: AppointmentType.CONSULTATION,
      [PrismaAppointmentType.FOLLOW_UP]: AppointmentType.FOLLOW_UP,
      [PrismaAppointmentType.THERAPY_SESSION]: AppointmentType.THERAPY_SESSION,
      [PrismaAppointmentType.ASSESSMENT]: AppointmentType.ASSESSMENT,
      [PrismaAppointmentType.GROUP_SESSION]: AppointmentType.GROUP_SESSION,
      [PrismaAppointmentType.EMERGENCY]: AppointmentType.EMERGENCY,
    };
    return typeMap[type];
  }

  private appointmentTypeToPrisma(
    type: AppointmentType,
  ): PrismaAppointmentType {
    const typeMap: Record<AppointmentType, PrismaAppointmentType> = {
      [AppointmentType.CONSULTATION]: PrismaAppointmentType.CONSULTATION,
      [AppointmentType.FOLLOW_UP]: PrismaAppointmentType.FOLLOW_UP,
      [AppointmentType.THERAPY_SESSION]: PrismaAppointmentType.THERAPY_SESSION,
      [AppointmentType.ASSESSMENT]: PrismaAppointmentType.ASSESSMENT,
      [AppointmentType.GROUP_SESSION]: PrismaAppointmentType.GROUP_SESSION,
      [AppointmentType.EMERGENCY]: PrismaAppointmentType.EMERGENCY,
    };
    return typeMap[type];
  }

  private meetingTypeFromPrisma(type: PrismaMeetingType): MeetingType {
    const typeMap: Record<PrismaMeetingType, MeetingType> = {
      [PrismaMeetingType.IN_PERSON]: MeetingType.IN_PERSON,
      [PrismaMeetingType.VIDEO_CALL]: MeetingType.VIDEO_CALL,
      [PrismaMeetingType.PHONE_CALL]: MeetingType.PHONE_CALL,
      [PrismaMeetingType.HYBRID]: MeetingType.HYBRID,
    };

    const mappedType = typeMap[type];
    if (!mappedType) {
      throw new Error(`Unknown PrismaMeetingType: ${type}`);
    }
    return mappedType;
  }

  private meetingTypeToPrisma(type: MeetingType): PrismaMeetingType {
    const typeMap: Record<MeetingType, PrismaMeetingType> = {
      [MeetingType.IN_PERSON]: PrismaMeetingType.IN_PERSON,
      [MeetingType.ONLINE]: PrismaMeetingType.VIDEO_CALL,
      [MeetingType.VIDEO_CALL]: PrismaMeetingType.VIDEO_CALL,
      [MeetingType.PHONE_CALL]: PrismaMeetingType.PHONE_CALL,
      [MeetingType.HYBRID]: PrismaMeetingType.HYBRID,
    };

    const mappedType = typeMap[type];
    if (!mappedType) {
      throw new Error(`Unknown MeetingType: ${type}`);
    }
    return mappedType;
  }
}
