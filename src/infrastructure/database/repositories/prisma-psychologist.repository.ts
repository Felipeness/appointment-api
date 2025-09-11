import { Injectable } from '@nestjs/common';
import { PsychologistRepository } from '../../../domain/repositories/psychologist.repository';
import { Psychologist } from '../../../domain/entities/psychologist.entity';
import { WorkingHours } from '../../../domain/value-objects/working-hours.vo';
import { PrismaService } from '../prisma.service';

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
    return psychologists.map(this.toDomain);
  }

  async save(psychologist: Psychologist): Promise<Psychologist> {
    const data = this.toPersistence(psychologist);
    const saved = await this.prisma.psychologist.create({ data });
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

  private toDomain(psychologist: any): Psychologist {
    const workingHours = new WorkingHours(
      psychologist.workingHours || '{}'
    );

    return new Psychologist(
      psychologist.id,
      psychologist.email,
      psychologist.name,
      workingHours,
      psychologist.phone,
      psychologist.registrationId,
      psychologist.biography,
      psychologist.consultationFeeMin,
      psychologist.consultationFeeMax,
      psychologist.yearsExperience,
      psychologist.profileImageUrl,
      psychologist.timeSlotDuration,
      psychologist.isActive,
      psychologist.isVerified,
      psychologist.createdAt,
      psychologist.updatedAt,
      psychologist.createdBy,
      psychologist.lastLoginAt
    );
  }

  private toPersistence(psychologist: Psychologist): any {
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