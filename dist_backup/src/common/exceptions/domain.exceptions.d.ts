import { HttpException, HttpStatus } from '@nestjs/common';
export declare abstract class DomainException extends HttpException {
    readonly code: string;
    constructor(message: string, statusCode: HttpStatus, code: string);
}
export declare class AppointmentNotFoundException extends DomainException {
    constructor(appointmentId: string);
}
export declare class AppointmentConflictException extends DomainException {
    constructor(message: string);
}
export declare class AppointmentValidationException extends DomainException {
    constructor(message: string);
}
export declare class AppointmentStateException extends DomainException {
    constructor(message: string);
}
export declare class PatientNotFoundException extends DomainException {
    constructor(identifier: string);
}
export declare class PatientValidationException extends DomainException {
    constructor(message: string);
}
export declare class PsychologistNotFoundException extends DomainException {
    constructor(identifier: string);
}
export declare class PsychologistNotAvailableException extends DomainException {
    constructor(message: string);
}
export declare class PsychologistValidationException extends DomainException {
    constructor(message: string);
}
export declare class BusinessRuleException extends DomainException {
    constructor(message: string);
}
export declare class SchedulingRuleException extends DomainException {
    constructor(message: string);
}
export declare class ExternalServiceException extends DomainException {
    constructor(service: string, message: string);
}
export declare class MessageQueueException extends DomainException {
    constructor(message: string);
}
export declare class DatabaseConnectionException extends DomainException {
    constructor(message: string);
}
export declare class ValidationError {
    readonly field: string;
    readonly message: string;
    readonly value?: unknown | undefined;
    constructor(field: string, message: string, value?: unknown | undefined);
}
export declare class MultipleValidationException extends DomainException {
    readonly errors: ValidationError[];
    constructor(errors: ValidationError[]);
}
