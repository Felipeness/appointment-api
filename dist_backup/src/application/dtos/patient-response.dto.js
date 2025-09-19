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
exports.PatientResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../domain/entities/enums");
class PatientResponseDto {
    id;
    email;
    name;
    phone;
    dateOfBirth;
    gender;
    address;
    emergencyContact;
    emergencyPhone;
    medicalNotes;
    preferredLanguage;
    isActive;
    createdAt;
    updatedAt;
    lastActiveAt;
}
exports.PatientResponseDto = PatientResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient ID',
        example: 'clx123456789',
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient email address',
        example: 'patient@example.com',
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient name',
        example: 'John Doe',
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient phone number',
        example: '+55 11 99999-9999',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Date of birth',
        example: '1990-05-15',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Gender',
        enum: enums_1.Gender,
        example: enums_1.Gender.PREFER_NOT_TO_SAY,
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient address',
        example: '123 Main St, City, State, ZIP',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Emergency contact name',
        example: 'Jane Doe',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "emergencyContact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Emergency contact phone',
        example: '+55 11 88888-8888',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "emergencyPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Medical notes and history',
        example: 'No known allergies',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "medicalNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Preferred language',
        example: 'Portuguese',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "preferredLanguage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Active status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PatientResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created timestamp',
        example: '2024-12-20T10:00:00Z',
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last updated timestamp',
        example: '2024-12-20T10:00:00Z',
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last active timestamp',
        example: '2024-12-20T10:00:00Z',
        required: false,
    }),
    __metadata("design:type", String)
], PatientResponseDto.prototype, "lastActiveAt", void 0);
//# sourceMappingURL=patient-response.dto.js.map