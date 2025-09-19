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
exports.PrismaPatientRepositoryAdapter = void 0;
const common_1 = require("@nestjs/common");
const patient_aggregate_1 = require("../../../domain/aggregates/patient.aggregate");
const patient_id_vo_1 = require("../../../domain/value-objects/patient-id.vo");
const email_vo_1 = require("../../../domain/value-objects/email.vo");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const enums_1 = require("../../../domain/entities/enums");
let PrismaPatientRepositoryAdapter = class PrismaPatientRepositoryAdapter {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(patient) {
        const snapshot = patient.toSnapshot();
        const prismaData = this.toPersistence(snapshot);
        await this.prisma.patient.upsert({
            where: { id: snapshot.id.toString() },
            create: prismaData,
            update: {
                ...prismaData,
                updatedAt: new Date(),
            },
        });
        patient.markEventsAsCommitted();
    }
    async findById(id) {
        const patient = await this.prisma.patient.findUnique({
            where: { id: id.toString() },
        });
        return patient ? this.toDomain(patient) : null;
    }
    async findByEmail(email) {
        const patient = await this.prisma.patient.findUnique({
            where: { email: email.toString() },
        });
        return patient ? this.toDomain(patient) : null;
    }
    async findActivePatients(limit = 50, offset = 0) {
        const patients = await this.prisma.patient.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
        return patients.map(patient => this.toDomain(patient));
    }
    async findInactivePatients(limit = 50, offset = 0) {
        const patients = await this.prisma.patient.findMany({
            where: { isActive: false },
            orderBy: { updatedAt: 'desc' },
            take: limit,
            skip: offset,
        });
        return patients.map(patient => this.toDomain(patient));
    }
    async existsById(id) {
        const patient = await this.prisma.patient.findUnique({
            where: { id: id.toString() },
            select: { id: true },
        });
        return !!patient;
    }
    async existsByEmail(email) {
        const patient = await this.prisma.patient.findUnique({
            where: { email: email.toString() },
            select: { id: true },
        });
        return !!patient;
    }
    async delete(id) {
        await this.prisma.patient.delete({
            where: { id: id.toString() },
        });
    }
    toDomain(prismaPatient) {
        const props = {
            id: patient_id_vo_1.PatientId.fromString(prismaPatient.id),
            email: email_vo_1.Email.create(prismaPatient.email),
            name: prismaPatient.name,
            phone: prismaPatient.phone || undefined,
            dateOfBirth: prismaPatient.dateOfBirth || undefined,
            gender: prismaPatient.gender ? this.genderFromPrisma(prismaPatient.gender) : undefined,
            address: prismaPatient.address || undefined,
            emergencyContact: prismaPatient.emergencyContact || undefined,
            emergencyPhone: prismaPatient.emergencyPhone || undefined,
            medicalNotes: prismaPatient.medicalNotes || undefined,
            preferredLanguage: prismaPatient.preferredLanguage || undefined,
            isActive: prismaPatient.isActive,
            createdAt: prismaPatient.createdAt,
            updatedAt: prismaPatient.updatedAt,
            lastActiveAt: prismaPatient.lastActiveAt || undefined,
        };
        return patient_aggregate_1.Patient.reconstitute(props, 1);
    }
    toPersistence(props) {
        return {
            id: props.id.toString(),
            email: props.email.toString(),
            name: props.name,
            phone: props.phone || null,
            dateOfBirth: props.dateOfBirth || null,
            gender: props.gender ? this.genderToPrisma(props.gender) : null,
            address: props.address || null,
            emergencyContact: props.emergencyContact || null,
            emergencyPhone: props.emergencyPhone || null,
            medicalNotes: props.medicalNotes || null,
            preferredLanguage: props.preferredLanguage || null,
            isActive: props.isActive,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
            lastActiveAt: props.lastActiveAt || null,
        };
    }
    genderFromPrisma(gender) {
        const genderMap = {
            MALE: enums_1.Gender.MALE,
            FEMALE: enums_1.Gender.FEMALE,
            NON_BINARY: enums_1.Gender.NON_BINARY,
            PREFER_NOT_TO_SAY: enums_1.Gender.PREFER_NOT_TO_SAY,
        };
        return genderMap[gender];
    }
    genderToPrisma(gender) {
        const genderMap = {
            [enums_1.Gender.MALE]: client_1.Gender.MALE,
            [enums_1.Gender.FEMALE]: client_1.Gender.FEMALE,
            [enums_1.Gender.OTHER]: client_1.Gender.NON_BINARY,
            [enums_1.Gender.NON_BINARY]: client_1.Gender.NON_BINARY,
            [enums_1.Gender.PREFER_NOT_TO_SAY]: client_1.Gender.PREFER_NOT_TO_SAY,
        };
        return genderMap[gender];
    }
};
exports.PrismaPatientRepositoryAdapter = PrismaPatientRepositoryAdapter;
exports.PrismaPatientRepositoryAdapter = PrismaPatientRepositoryAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPatientRepositoryAdapter);
//# sourceMappingURL=prisma-patient.repository.adapter.js.map