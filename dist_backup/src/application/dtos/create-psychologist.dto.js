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
exports.CreatePsychologistDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePsychologistDto {
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
}
exports.CreatePsychologistDto = CreatePsychologistDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist email address',
        example: 'psychologist@example.com',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist name',
        example: 'Dr. Jane Smith',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Working hours in JSON format',
        example: '{"monday": [{"start": "09:00", "end": "17:00"}], "tuesday": [{"start": "09:00", "end": "17:00"}]}',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "workingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phone number',
        example: '+55 11 99999-9999',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Professional registration ID (CRP/CRM)',
        example: 'CRP 12345',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "registrationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Professional biography',
        example: 'Specialized in cognitive behavioral therapy with 10 years of experience',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Minimum consultation fee',
        example: 100.0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePsychologistDto.prototype, "consultationFeeMin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Maximum consultation fee',
        example: 200.0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePsychologistDto.prototype, "consultationFeeMax", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Years of experience',
        example: 10,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(70),
    __metadata("design:type", Number)
], CreatePsychologistDto.prototype, "yearsExperience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Profile image URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreatePsychologistDto.prototype, "profileImageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Time slot duration in minutes',
        example: 60,
        default: 60,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreatePsychologistDto.prototype, "timeSlotDuration", void 0);
//# sourceMappingURL=create-psychologist.dto.js.map