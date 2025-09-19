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
exports.AppointmentResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../domain/entities/enums");
class AppointmentResponseDto {
    id;
    patientId;
    psychologistId;
    scheduledAt;
    duration;
    appointmentType;
    status;
    meetingType;
    meetingUrl;
    meetingRoom;
    reason;
    notes;
    privateNotes;
    consultationFee;
    isPaid;
    cancelledAt;
    cancelledBy;
    cancellationReason;
    createdAt;
    updatedAt;
    confirmedAt;
    completedAt;
}
exports.AppointmentResponseDto = AppointmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Appointment ID',
        example: 'clx123456789',
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Patient ID',
        example: 'clx987654321',
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "patientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Psychologist ID',
        example: 'clx111222333',
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "psychologistId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Scheduled date and time',
        example: '2024-12-25T10:00:00Z',
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Appointment duration in minutes',
        example: 60,
    }),
    __metadata("design:type", Number)
], AppointmentResponseDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of appointment',
        enum: enums_1.AppointmentType,
        example: enums_1.AppointmentType.CONSULTATION,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "appointmentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Appointment status',
        enum: enums_1.AppointmentStatus,
        example: enums_1.AppointmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meeting type',
        enum: enums_1.MeetingType,
        example: enums_1.MeetingType.IN_PERSON,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "meetingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meeting URL for video/phone calls',
        example: 'https://meet.google.com/xyz-abc-def',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "meetingUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meeting room for in-person appointments',
        example: 'Room 301',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "meetingRoom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reason for appointment',
        example: 'Anxiety treatment consultation',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional notes',
        example: 'First consultation',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Private notes (psychologist only)',
        example: 'Patient shows signs of improvement',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "privateNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Consultation fee',
        example: 150.0,
        required: false,
    }),
    __metadata("design:type", Number)
], AppointmentResponseDto.prototype, "consultationFee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment status',
        example: false,
    }),
    __metadata("design:type", Boolean)
], AppointmentResponseDto.prototype, "isPaid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cancelled timestamp',
        example: '2024-12-20T10:00:00Z',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "cancelledAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Who cancelled the appointment',
        example: 'patient',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "cancelledBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cancellation reason',
        example: 'Personal emergency',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "cancellationReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Created timestamp',
        example: '2024-12-20T10:00:00Z',
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last updated timestamp',
        example: '2024-12-20T10:00:00Z',
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Confirmed timestamp',
        example: '2024-12-20T10:00:00Z',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Completed timestamp',
        example: '2024-12-20T10:00:00Z',
        required: false,
    }),
    __metadata("design:type", String)
], AppointmentResponseDto.prototype, "completedAt", void 0);
//# sourceMappingURL=appointment-response.dto.js.map