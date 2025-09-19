"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const date_fns_1 = require("date-fns");
const enums_1 = require("./enums");
class Appointment {
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
    constructor(id, patientId, psychologistId, scheduledAt, duration = 60, appointmentType = enums_1.AppointmentType.CONSULTATION, status = enums_1.AppointmentStatus.PENDING, meetingType = enums_1.MeetingType.IN_PERSON, meetingUrl, meetingRoom, reason, notes, privateNotes, consultationFee, isPaid = false, cancelledAt, cancelledBy, cancellationReason, createdAt = new Date(), updatedAt = new Date(), confirmedAt, completedAt) {
        this.id = id;
        this.patientId = patientId;
        this.psychologistId = psychologistId;
        this.scheduledAt = scheduledAt;
        this.duration = duration;
        this.appointmentType = appointmentType;
        this.status = status;
        this.meetingType = meetingType;
        this.meetingUrl = meetingUrl;
        this.meetingRoom = meetingRoom;
        this.reason = reason;
        this.notes = notes;
        this.privateNotes = privateNotes;
        this.consultationFee = consultationFee;
        this.isPaid = isPaid;
        this.cancelledAt = cancelledAt;
        this.cancelledBy = cancelledBy;
        this.cancellationReason = cancellationReason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.confirmedAt = confirmedAt;
        this.completedAt = completedAt;
        this.validate();
    }
    validate() {
        if (!this.id) {
            throw new Error('Appointment ID is required');
        }
        if (!this.patientId) {
            throw new Error('Patient ID is required');
        }
        if (!this.psychologistId) {
            throw new Error('Psychologist ID is required');
        }
        if (!this.scheduledAt) {
            throw new Error('Scheduled date and time is required');
        }
        if (this.patientId === this.psychologistId) {
            throw new Error('Patient and psychologist cannot be the same person');
        }
    }
    isScheduledWithin24Hours() {
        const twentyFourHoursFromNow = (0, date_fns_1.addHours)(new Date(), 24);
        return (0, date_fns_1.isBefore)(this.scheduledAt, twentyFourHoursFromNow);
    }
    isPast() {
        return (0, date_fns_1.isBefore)(this.scheduledAt, new Date());
    }
    canBeConfirmed() {
        return this.status === enums_1.AppointmentStatus.PENDING && !this.isPast();
    }
    canBeDeclined() {
        return this.status === enums_1.AppointmentStatus.PENDING && !this.isPast();
    }
    canBeCancelled() {
        return ((this.status === enums_1.AppointmentStatus.CONFIRMED ||
            this.status === enums_1.AppointmentStatus.PENDING) &&
            !this.isPast());
    }
    canBeCompleted() {
        return this.status === enums_1.AppointmentStatus.CONFIRMED && this.isPast();
    }
    confirm(notes) {
        if (!this.canBeConfirmed()) {
            throw new Error('Appointment cannot be confirmed in current state');
        }
        return new Appointment(this.id, this.patientId, this.psychologistId, this.scheduledAt, this.duration, this.appointmentType, enums_1.AppointmentStatus.CONFIRMED, this.meetingType, this.meetingUrl, this.meetingRoom, this.reason, notes || this.notes, this.privateNotes, this.consultationFee, this.isPaid, this.cancelledAt, this.cancelledBy, this.cancellationReason, this.createdAt, new Date(), new Date(), this.completedAt);
    }
    decline(notes) {
        if (!this.canBeDeclined()) {
            throw new Error('Appointment cannot be declined in current state');
        }
        return new Appointment(this.id, this.patientId, this.psychologistId, this.scheduledAt, this.duration, this.appointmentType, enums_1.AppointmentStatus.DECLINED, this.meetingType, this.meetingUrl, this.meetingRoom, this.reason, notes || this.notes, this.privateNotes, this.consultationFee, this.isPaid, this.cancelledAt, this.cancelledBy, this.cancellationReason, this.createdAt, new Date(), this.confirmedAt, this.completedAt);
    }
    cancel(cancelledBy, reason) {
        if (!this.canBeCancelled()) {
            throw new Error('Appointment cannot be cancelled in current state');
        }
        return new Appointment(this.id, this.patientId, this.psychologistId, this.scheduledAt, this.duration, this.appointmentType, enums_1.AppointmentStatus.CANCELLED, this.meetingType, this.meetingUrl, this.meetingRoom, this.reason, this.notes, this.privateNotes, this.consultationFee, this.isPaid, new Date(), cancelledBy, reason, this.createdAt, new Date(), this.confirmedAt, this.completedAt);
    }
    complete(notes) {
        if (!this.canBeCompleted()) {
            throw new Error('Appointment cannot be completed in current state');
        }
        return new Appointment(this.id, this.patientId, this.psychologistId, this.scheduledAt, this.duration, this.appointmentType, enums_1.AppointmentStatus.COMPLETED, this.meetingType, this.meetingUrl, this.meetingRoom, this.reason, notes || this.notes, this.privateNotes, this.consultationFee, this.isPaid, this.cancelledAt, this.cancelledBy, this.cancellationReason, this.createdAt, new Date(), this.confirmedAt, new Date());
    }
}
exports.Appointment = Appointment;
//# sourceMappingURL=appointment.entity.js.map