"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const zod_1 = require("zod");
const aggregate_root_base_1 = require("../base/aggregate-root.base");
const appointment_id_vo_1 = require("../value-objects/appointment-id.vo");
const date_service_1 = require("../services/date.service");
const appointment_events_1 = require("../events/appointment.events");
const enums_1 = require("../entities/enums");
const AppointmentPropsSchema = zod_1.z.object({
    id: zod_1.z.any(),
    patientId: zod_1.z.any(),
    psychologistId: zod_1.z.any(),
    scheduledAt: zod_1.z.date().refine(date => date > new Date(), 'Appointment must be scheduled in the future'),
    duration: zod_1.z.number().min(15, 'Duration must be at least 15 minutes').max(240, 'Duration cannot exceed 4 hours').default(60),
    appointmentType: zod_1.z.nativeEnum(enums_1.AppointmentType).default(enums_1.AppointmentType.CONSULTATION),
    status: zod_1.z.nativeEnum(enums_1.AppointmentStatus).default(enums_1.AppointmentStatus.PENDING),
    meetingType: zod_1.z.nativeEnum(enums_1.MeetingType).default(enums_1.MeetingType.IN_PERSON),
    meetingUrl: zod_1.z.string().url().optional(),
    meetingRoom: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    privateNotes: zod_1.z.string().optional(),
    consultationFee: zod_1.z.number().positive().optional(),
    isPaid: zod_1.z.boolean().default(false),
    cancelledAt: zod_1.z.date().optional(),
    cancelledBy: zod_1.z.string().optional(),
    cancellationReason: zod_1.z.string().optional(),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    confirmedAt: zod_1.z.date().optional(),
    completedAt: zod_1.z.date().optional(),
});
class Appointment extends aggregate_root_base_1.AggregateRoot {
    constructor(props, version) {
        super(props, props.id.toString(), version);
        this.validate();
    }
    static create(props) {
        const appointmentProps = {
            ...props,
            id: appointment_id_vo_1.AppointmentId.create(),
            createdAt: date_service_1.DateService.now(),
            updatedAt: date_service_1.DateService.now(),
        };
        const validatedProps = AppointmentPropsSchema.parse(appointmentProps);
        const appointment = new Appointment(validatedProps);
        appointment.addDomainEvent(new appointment_events_1.AppointmentScheduledEvent(validatedProps.id, validatedProps.patientId, validatedProps.psychologistId, validatedProps.scheduledAt, validatedProps.duration, appointment.version));
        return appointment;
    }
    static reconstitute(props, version) {
        return new Appointment(props, version);
    }
    validate() {
        const props = this.props;
        if (!props.id) {
            throw new Error('Appointment ID is required');
        }
        if (!props.patientId) {
            throw new Error('Patient ID is required');
        }
        if (!props.psychologistId) {
            throw new Error('Psychologist ID is required');
        }
        if (!props.scheduledAt) {
            throw new Error('Scheduled date and time is required');
        }
        if (props.patientId.equals(props.psychologistId)) {
            throw new Error('Patient and psychologist cannot be the same person');
        }
        if (props.meetingType === enums_1.MeetingType.ONLINE && !props.meetingUrl) {
            throw new Error('Meeting URL is required for online appointments');
        }
        if (props.meetingType === enums_1.MeetingType.IN_PERSON && !props.meetingRoom) {
            throw new Error('Meeting room is required for in-person appointments');
        }
    }
    get appointmentId() {
        return this.props.id;
    }
    get patientId() {
        return this.props.patientId;
    }
    get psychologistId() {
        return this.props.psychologistId;
    }
    get scheduledAt() {
        return this.props.scheduledAt;
    }
    get status() {
        return this.props.status;
    }
    get duration() {
        return this.props.duration;
    }
    isScheduledWithin24Hours() {
        const twentyFourHoursFromNow = date_service_1.DateService.addHours(date_service_1.DateService.now(), 24);
        return date_service_1.DateService.isBefore(this.props.scheduledAt, twentyFourHoursFromNow);
    }
    isPast() {
        return date_service_1.DateService.isBefore(this.props.scheduledAt, date_service_1.DateService.now());
    }
    canBeConfirmed() {
        return this.props.status === enums_1.AppointmentStatus.PENDING && !this.isPast();
    }
    canBeDeclined() {
        return this.props.status === enums_1.AppointmentStatus.PENDING && !this.isPast();
    }
    canBeCancelled() {
        return ((this.props.status === enums_1.AppointmentStatus.CONFIRMED ||
            this.props.status === enums_1.AppointmentStatus.PENDING) &&
            !this.isPast());
    }
    canBeCompleted() {
        return this.props.status === enums_1.AppointmentStatus.CONFIRMED && this.isPast();
    }
    confirm(notes) {
        if (!this.canBeConfirmed()) {
            throw new Error('Appointment cannot be confirmed in current state');
        }
        this.props.status = enums_1.AppointmentStatus.CONFIRMED;
        this.props.confirmedAt = date_service_1.DateService.now();
        this.props.updatedAt = date_service_1.DateService.now();
        if (notes) {
            this.props.notes = notes;
        }
        this.addDomainEvent(new appointment_events_1.AppointmentConfirmedEvent(this.props.id, this.props.confirmedAt, notes, this.version));
    }
    decline(notes) {
        if (!this.canBeDeclined()) {
            throw new Error('Appointment cannot be declined in current state');
        }
        this.props.status = enums_1.AppointmentStatus.DECLINED;
        this.props.updatedAt = date_service_1.DateService.now();
        if (notes) {
            this.props.notes = notes;
        }
        this.addDomainEvent(new appointment_events_1.AppointmentDeclinedEvent(this.props.id, date_service_1.DateService.now(), notes, this.version));
    }
    cancel(cancelledBy, reason) {
        if (!this.canBeCancelled()) {
            throw new Error('Appointment cannot be cancelled in current state');
        }
        this.props.status = enums_1.AppointmentStatus.CANCELLED;
        this.props.cancelledAt = date_service_1.DateService.now();
        this.props.cancelledBy = cancelledBy;
        this.props.cancellationReason = reason;
        this.props.updatedAt = date_service_1.DateService.now();
        this.addDomainEvent(new appointment_events_1.AppointmentCancelledEvent(this.props.id, this.props.cancelledAt, cancelledBy, reason, this.version));
    }
    complete(notes) {
        if (!this.canBeCompleted()) {
            throw new Error('Appointment cannot be completed in current state');
        }
        this.props.status = enums_1.AppointmentStatus.COMPLETED;
        this.props.completedAt = date_service_1.DateService.now();
        this.props.updatedAt = date_service_1.DateService.now();
        if (notes) {
            this.props.notes = notes;
        }
        this.addDomainEvent(new appointment_events_1.AppointmentCompletedEvent(this.props.id, this.props.completedAt, notes, this.version));
    }
    toSnapshot() {
        return { ...this.props };
    }
}
exports.Appointment = Appointment;
//# sourceMappingURL=appointment.aggregate.js.map