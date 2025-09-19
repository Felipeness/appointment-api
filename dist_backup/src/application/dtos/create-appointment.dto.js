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
exports.CreateAppointmentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../domain/entities/enums");
const create_appointment_zod_1 = require("./create-appointment.zod");
class CreateAppointmentDto {
    static validateWithZod(data) {
        return create_appointment_zod_1.CreateAppointmentSchema.parse(data);
    }
    static create(data) {
        const validatedData = CreateAppointmentDto.validateWithZod(data);
        const dto = new CreateAppointmentDto();
        Object.assign(dto, validatedData);
        return dto;
    }
    patientEmail;
    patientName;
    patientPhone;
    psychologistId;
    scheduledAt;
    duration;
    appointmentType;
    meetingType;
    meetingUrl;
    meetingRoom;
    reason;
    notes;
    consultationFee;
}
exports.CreateAppointmentDto = CreateAppointmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient email address',
        example: 'patient@example.com',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    (0, class_validator_1.Length)(1, 255, { message: 'Email must be between 1 and 255 characters' }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "patientEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient name',
        example: 'John Doe',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient name is required' }),
    (0, class_validator_1.Length)(2, 150, {
        message: 'Patient name must be between 2 and 150 characters',
    }),
    (0, class_validator_1.Matches)(/^[a-zA-ZÀ-ÿ\u00C0-\u017F\s\-.']+$/, {
        message: 'Patient name contains invalid characters',
    }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : value),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient phone number',
        example: '+55 11 99999-9999',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[+]?[\d\s\-()]{8,20}$/, {
        message: 'Invalid phone number format',
    }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string'
        ? value.replace(/[^\d+\-()\s]/g, '').trim()
        : value),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "patientPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist ID',
        example: 'clx123456789',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "psychologistId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Appointment scheduled date and time (ISO 8601)',
        example: '2024-12-25T10:00:00Z',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Appointment duration in minutes',
        example: 60,
        default: 60,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    __metadata("design:type", Number)
], CreateAppointmentDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of appointment',
        enum: enums_1.AppointmentType,
        example: enums_1.AppointmentType.CONSULTATION,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.AppointmentType),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "appointmentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meeting type',
        enum: enums_1.MeetingType,
        example: enums_1.MeetingType.IN_PERSON,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.MeetingType),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "meetingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meeting URL for video/phone calls',
        example: 'https://meet.google.com/xyz-abc-def',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.ValidateIf)((o) => o.meetingType === enums_1.MeetingType.VIDEO_CALL ||
        o.meetingType === enums_1.MeetingType.PHONE_CALL),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "meetingUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meeting room for in-person appointments',
        example: 'Room 301',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.ValidateIf)((o) => o.meetingType === enums_1.MeetingType.IN_PERSON),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "meetingRoom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reason for appointment',
        example: 'Anxiety treatment consultation',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        example: 'First consultation',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Consultation fee for this appointment',
        example: 150.0,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAppointmentDto.prototype, "consultationFee", void 0);
//# sourceMappingURL=create-appointment.dto.js.map