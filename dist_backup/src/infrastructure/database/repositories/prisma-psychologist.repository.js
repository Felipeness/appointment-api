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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPsychologistRepository = void 0;
const common_1 = require("@nestjs/common");
const psychologist_entity_1 = require("../../../domain/entities/psychologist.entity");
const working_hours_vo_1 = require("../../../domain/value-objects/working-hours.vo");
const prisma_service_1 = require("../prisma.service");
let PrismaPsychologistRepository = class PrismaPsychologistRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const psychologist = await this.prisma.psychologist.findUnique({
            where: { id },
        });
        return psychologist ? this.toDomain(psychologist) : null;
    }
    async findByEmail(email) {
        const psychologist = await this.prisma.psychologist.findUnique({
            where: { email },
        });
        return psychologist ? this.toDomain(psychologist) : null;
    }
    async findAll() {
        const psychologists = await this.prisma.psychologist.findMany();
        return psychologists.map((psychologist) => this.toDomain(psychologist));
    }
    async save(psychologist) {
        const data = this.toPersistence(psychologist);
        const saved = await this.prisma.psychologist.create({
            data: data,
        });
        return this.toDomain(saved);
    }
    async update(psychologist) {
        const data = this.toPersistence(psychologist);
        const updated = await this.prisma.psychologist.update({
            where: { id: psychologist.id },
            data,
        });
        return this.toDomain(updated);
    }
    async delete(id) {
        await this.prisma.psychologist.delete({
            where: { id },
        });
    }
    toDomain(psychologist) {
        const workingHours = new working_hours_vo_1.WorkingHours(psychologist.workingHours ||
            '{}');
        return new psychologist_entity_1.Psychologist(psychologist.id, psychologist.email, psychologist.name, workingHours, psychologist.phone || undefined, psychologist.registrationId || undefined, psychologist.biography || undefined, psychologist.consultationFeeMin
            ? Number(psychologist.consultationFeeMin)
            : undefined, psychologist.consultationFeeMax
            ? Number(psychologist.consultationFeeMax)
            : undefined, psychologist.yearsExperience || undefined, psychologist.profileImageUrl || undefined, psychologist.timeSlotDuration, psychologist.isActive, psychologist.isVerified, psychologist.createdAt, psychologist.updatedAt, psychologist.createdBy || undefined, psychologist.lastLoginAt || undefined);
    }
    toPersistence(psychologist) {
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
};
exports.PrismaPsychologistRepository = PrismaPsychologistRepository;
exports.PrismaPsychologistRepository = PrismaPsychologistRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPsychologistRepository);
//# sourceMappingURL=prisma-psychologist.repository.js.map