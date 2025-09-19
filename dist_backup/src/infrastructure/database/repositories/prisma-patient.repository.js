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
exports.PrismaPatientRepository = void 0;
const common_1 = require("@nestjs/common");
const patient_entity_1 = require("../../../domain/entities/patient.entity");
const prisma_service_1 = require("../prisma.service");
let PrismaPatientRepository = class PrismaPatientRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
        });
        return patient ? this.toDomain(patient) : null;
    }
    async findByEmail(email) {
        const patient = await this.prisma.patient.findUnique({
            where: { email },
        });
        return patient ? this.toDomain(patient) : null;
    }
    async findAll() {
        const patients = await this.prisma.patient.findMany();
        return patients.map((patient) => this.toDomain(patient));
    }
    async save(patient) {
        const data = this.toPersistence(patient);
        const saved = await this.prisma.patient.create({
            data: data,
        });
        return this.toDomain(saved);
    }
    async update(patient) {
        const data = this.toPersistence(patient);
        const updated = await this.prisma.patient.update({
            where: { id: patient.id },
            data,
        });
        return this.toDomain(updated);
    }
    async delete(id) {
        await this.prisma.patient.delete({
            where: { id },
        });
    }
    toDomain(patient) {
        return new patient_entity_1.Patient(patient.id, patient.email, patient.name, patient.phone || undefined, patient.dateOfBirth || undefined, patient.gender, patient.address || undefined, patient.emergencyContact || undefined, patient.emergencyPhone || undefined, patient.medicalNotes || undefined, patient.preferredLanguage || undefined, patient.isActive, patient.createdAt, patient.updatedAt, patient.lastActiveAt || undefined);
    }
    toPersistence(patient) {
        return {
            id: patient.id,
            email: patient.email,
            name: patient.name,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            address: patient.address,
            emergencyContact: patient.emergencyContact,
            emergencyPhone: patient.emergencyPhone,
            medicalNotes: patient.medicalNotes,
            preferredLanguage: patient.preferredLanguage,
            isActive: patient.isActive,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
            lastActiveAt: patient.lastActiveAt,
        };
    }
};
exports.PrismaPatientRepository = PrismaPatientRepository;
exports.PrismaPatientRepository = PrismaPatientRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPatientRepository);
//# sourceMappingURL=prisma-patient.repository.js.map