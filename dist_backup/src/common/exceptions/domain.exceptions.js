"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipleValidationException = exports.ValidationError = exports.DatabaseConnectionException = exports.MessageQueueException = exports.ExternalServiceException = exports.SchedulingRuleException = exports.BusinessRuleException = exports.PsychologistValidationException = exports.PsychologistNotAvailableException = exports.PsychologistNotFoundException = exports.PatientValidationException = exports.PatientNotFoundException = exports.AppointmentStateException = exports.AppointmentValidationException = exports.AppointmentConflictException = exports.AppointmentNotFoundException = exports.DomainException = void 0;
const common_1 = require("@nestjs/common");
class DomainException extends common_1.HttpException {
    code;
    constructor(message, statusCode, code) {
        super(message, statusCode);
        this.code = code;
        this.name = this.constructor.name;
    }
}
exports.DomainException = DomainException;
class AppointmentNotFoundException extends DomainException {
    constructor(appointmentId) {
        super(`Appointment with ID '${appointmentId}' not found`, common_1.HttpStatus.NOT_FOUND, 'APPOINTMENT_NOT_FOUND');
    }
}
exports.AppointmentNotFoundException = AppointmentNotFoundException;
class AppointmentConflictException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.CONFLICT, 'APPOINTMENT_CONFLICT');
    }
}
exports.AppointmentConflictException = AppointmentConflictException;
class AppointmentValidationException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'APPOINTMENT_VALIDATION_ERROR');
    }
}
exports.AppointmentValidationException = AppointmentValidationException;
class AppointmentStateException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'APPOINTMENT_INVALID_STATE');
    }
}
exports.AppointmentStateException = AppointmentStateException;
class PatientNotFoundException extends DomainException {
    constructor(identifier) {
        super(`Patient with identifier '${identifier}' not found`, common_1.HttpStatus.NOT_FOUND, 'PATIENT_NOT_FOUND');
    }
}
exports.PatientNotFoundException = PatientNotFoundException;
class PatientValidationException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'PATIENT_VALIDATION_ERROR');
    }
}
exports.PatientValidationException = PatientValidationException;
class PsychologistNotFoundException extends DomainException {
    constructor(identifier) {
        super(`Psychologist with identifier '${identifier}' not found`, common_1.HttpStatus.NOT_FOUND, 'PSYCHOLOGIST_NOT_FOUND');
    }
}
exports.PsychologistNotFoundException = PsychologistNotFoundException;
class PsychologistNotAvailableException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'PSYCHOLOGIST_NOT_AVAILABLE');
    }
}
exports.PsychologistNotAvailableException = PsychologistNotAvailableException;
class PsychologistValidationException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'PSYCHOLOGIST_VALIDATION_ERROR');
    }
}
exports.PsychologistValidationException = PsychologistValidationException;
class BusinessRuleException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'BUSINESS_RULE_VIOLATION');
    }
}
exports.BusinessRuleException = BusinessRuleException;
class SchedulingRuleException extends DomainException {
    constructor(message) {
        super(message, common_1.HttpStatus.BAD_REQUEST, 'SCHEDULING_RULE_VIOLATION');
    }
}
exports.SchedulingRuleException = SchedulingRuleException;
class ExternalServiceException extends DomainException {
    constructor(service, message) {
        super(`External service '${service}' error: ${message}`, common_1.HttpStatus.BAD_GATEWAY, 'EXTERNAL_SERVICE_ERROR');
    }
}
exports.ExternalServiceException = ExternalServiceException;
class MessageQueueException extends DomainException {
    constructor(message) {
        super(`Message queue error: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'MESSAGE_QUEUE_ERROR');
    }
}
exports.MessageQueueException = MessageQueueException;
class DatabaseConnectionException extends DomainException {
    constructor(message) {
        super(`Database connection error: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_CONNECTION_ERROR');
    }
}
exports.DatabaseConnectionException = DatabaseConnectionException;
class ValidationError {
    field;
    message;
    value;
    constructor(field, message, value) {
        this.field = field;
        this.message = message;
        this.value = value;
    }
}
exports.ValidationError = ValidationError;
class MultipleValidationException extends DomainException {
    errors;
    constructor(errors) {
        const messages = errors.map((error) => `${error.field}: ${error.message}`);
        super(`Validation failed: ${messages.join(', ')}`, common_1.HttpStatus.BAD_REQUEST, 'MULTIPLE_VALIDATION_ERRORS');
        this.errors = errors;
    }
}
exports.MultipleValidationException = MultipleValidationException;
//# sourceMappingURL=domain.exceptions.js.map