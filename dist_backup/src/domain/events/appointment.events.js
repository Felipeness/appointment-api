"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentDeclinedEvent = exports.AppointmentCompletedEvent = exports.AppointmentCancelledEvent = exports.AppointmentConfirmedEvent = exports.AppointmentScheduledEvent = void 0;
const domain_event_base_1 = require("../base/domain-event.base");
class AppointmentScheduledEvent extends domain_event_base_1.BaseDomainEvent {
    patientId;
    psychologistId;
    scheduledAt;
    duration;
    constructor(appointmentId, patientId, psychologistId, scheduledAt, duration, version = 1) {
        super(appointmentId.toString(), version);
        this.patientId = patientId;
        this.psychologistId = psychologistId;
        this.scheduledAt = scheduledAt;
        this.duration = duration;
    }
}
exports.AppointmentScheduledEvent = AppointmentScheduledEvent;
class AppointmentConfirmedEvent extends domain_event_base_1.BaseDomainEvent {
    confirmedAt;
    notes;
    constructor(appointmentId, confirmedAt, notes, version = 1) {
        super(appointmentId.toString(), version);
        this.confirmedAt = confirmedAt;
        this.notes = notes;
    }
}
exports.AppointmentConfirmedEvent = AppointmentConfirmedEvent;
class AppointmentCancelledEvent extends domain_event_base_1.BaseDomainEvent {
    cancelledAt;
    cancelledBy;
    reason;
    constructor(appointmentId, cancelledAt, cancelledBy, reason, version = 1) {
        super(appointmentId.toString(), version);
        this.cancelledAt = cancelledAt;
        this.cancelledBy = cancelledBy;
        this.reason = reason;
    }
}
exports.AppointmentCancelledEvent = AppointmentCancelledEvent;
class AppointmentCompletedEvent extends domain_event_base_1.BaseDomainEvent {
    completedAt;
    notes;
    constructor(appointmentId, completedAt, notes, version = 1) {
        super(appointmentId.toString(), version);
        this.completedAt = completedAt;
        this.notes = notes;
    }
}
exports.AppointmentCompletedEvent = AppointmentCompletedEvent;
class AppointmentDeclinedEvent extends domain_event_base_1.BaseDomainEvent {
    declinedAt;
    notes;
    constructor(appointmentId, declinedAt, notes, version = 1) {
        super(appointmentId.toString(), version);
        this.declinedAt = declinedAt;
        this.notes = notes;
    }
}
exports.AppointmentDeclinedEvent = AppointmentDeclinedEvent;
//# sourceMappingURL=appointment.events.js.map