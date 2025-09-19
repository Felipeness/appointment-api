import { Injectable } from '@nestjs/common';
import { PsychologistRepository } from '../../../domain/repositories/psychologist.repository';
import { Psychologist } from '../../../domain/entities/psychologist.entity';
import { WorkingHours } from '../../../domain/value-objects/working-hours.vo';
import { PrismaService } from '../prisma.service';
import { Psychologist as PrismaPsychologist } from '@prisma/client';

@Injectable()
export class PrismaPsychologistRepository implements PsychologistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Psychologist | null> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { id },
    });

    return psychologist ? this.toDomain(psychologist) : null;
  }

  async findByEmail(email: string): Promise<Psychologist | null> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { email },
    });

    return psychologist ? this.toDomain(psychologist) : null;
  }

  async findAll(): Promise<Psychologist[]> {
    const psychologists = await this.prisma.psychologist.findMany();
    return psychologists.map((psychologist) => this.toDomain(psychologist));
  }

  async save(psychologist: Psychologist): Promise<Psychologist> {
    const data = this.toPersistence(psychologist);
    const saved = await this.prisma.psychologist.create({
      data: data as unknown as Parameters<
        typeof this.prisma.psychologist.create
      >[0]['data'],
    });
    return this.toDomain(saved);
  }

  async update(psychologist: Psychologist): Promise<Psychologist> {
    const data = this.toPersistence(psychologist);
    const updated = await this.prisma.psychologist.update({
      where: { id: psychologist.id },
      data,
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.psychologist.delete({
      where: { id },
    });
  }

  private toDomain(psychologist: PrismaPsychologist): Psychologist {
    const workingHours = new WorkingHours(
      (psychologist as unknown as { workingHours?: string }).workingHours ??
        '{}',
    );

    return new Psychologist(
      psychologist.id,
      psychologist.email,
      psychologist.name,
      workingHours,
      psychologist.phone ?? undefined,
      psychologist.registrationId ?? undefined,
      psychologist.biography ?? undefined,
      psychologist.consultationFeeMin
        ? Number(psychologist.consultationFeeMin)
        : undefined,
      psychologist.consultationFeeMax
        ? Number(psychologist.consultationFeeMax)
        : undefined,
      psychologist.yearsExperience ?? undefined,
      psychologist.profileImageUrl ?? undefined,
      psychologist.timeSlotDuration,
      psychologist.isActive,
      psychologist.isVerified,
      psychologist.createdAt,
      psychologist.updatedAt,
      psychologist.createdBy ?? undefined,
      psychologist.lastLoginAt ?? undefined,
    );
  }

  private toPersistence(psychologist: Psychologist): Record<string, unknown> {
    return {
      id: psychologist.id,
      email: psychologist.email,
      name: psychologist.name,
      workingHours: JSON.stringify(psychologist.workingHours),
      phone: psychologist.phone,
      registrationId: psychologist.registrationId,
      biography: psychologist.biography,
      consultationFeeMin: psychologist.consultationFeeMin,
      consultationFeeMax: psychologist.consultationFeeMax,
      yearsExperience: psychologist.yearsExperience,
      profileImageUrl: psychologist.profileImageUrl,
      timeSlotDuration: psychologist.timeSlotDuration,
      isActive: psychologist.isActive,
      isVerified: psychologist.isVerified,
      createdAt: psychologist.createdAt,
      updatedAt: psychologist.updatedAt,
      createdBy: psychologist.createdBy,
      lastLoginAt: psychologist.lastLoginAt,
    };
  }
}
