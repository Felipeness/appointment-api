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
exports.PsychologistResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PsychologistResponseDto {
    id;
    email;
    name;
    workingHours;
    phone;
    registrationId;
    biography;
    consultationFeeMin;
    consultationFeeMax;
    yearsExperience;
    profileImageUrl;
    timeSlotDuration;
    isActive;
    isVerified;
    createdAt;
    updatedAt;
    createdBy;
    lastLoginAt;
}
exports.PsychologistResponseDto = PsychologistResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist ID',
        example: 'clx123456789',
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist email address',
        example: 'psychologist@example.com',
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist name',
        example: 'Dr. Jane Smith',
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Working hours in JSON format',
        example: '{"monday": [{"start": "09:00", "end": "17:00"}], "tuesday": [{"start": "09:00", "end": "17:00"}]}',
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "workingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phone number',
        example: '+55 11 99999-9999',
        required: false,
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Professional registration ID (CRP/CRM)',
        example: 'CRP 12345',
        required: false,
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "registrationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Professional biography',
        example: 'Specialized in cognitive behavioral therapy with 10 years of experience',
        required: false,
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Minimum consultation fee',
        example: 100.0,
        required: false,
    }),
    __metadata("design:type", Number)
], PsychologistResponseDto.prototype, "consultationFeeMin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Maximum consultation fee',
        example: 200.0,
        required: false,
    }),
    __metadata("design:type", Number)
], PsychologistResponseDto.prototype, "consultationFeeMax", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Years of experience',
        example: 10,
        required: false,
    }),
    __metadata("design:type", Number)
], PsychologistResponseDto.prototype, "yearsExperience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Profile image URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "profileImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Time slot duration in minutes',
        example: 60,
    }),
    __metadata("design:type", Number)
], PsychologistResponseDto.prototype, "timeSlotDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Active status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PsychologistResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Verification status',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PsychologistResponseDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created timestamp',
        example: '2024-12-20T10:00:00Z',
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last updated timestamp',
        example: '2024-12-20T10:00:00Z',
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created by user ID',
        example: 'clx987654321',
        required: false,
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last login timestamp',
        example: '2024-12-20T10:00:00Z',
        required: false,
    }),
    __metadata("design:type", String)
], PsychologistResponseDto.prototype, "lastLoginAt", void 0);
//# sourceMappingURL=psychologist-response.dto.js.map