import { HttpException, HttpStatus } from '@nestjs/common';

// Base domain exception
export abstract class DomainException extends HttpException {
  constructor(message: string, statusCode: HttpStatus, public readonly code: string) {
    super(message, statusCode);
    this.name = this.constructor.name;
  }
}

// Appointment domain exceptions
export class AppointmentNotFoundException extends DomainException {
  constructor(appointmentId: string) {
    super(
      `Appointment with ID '${appointmentId}' not found`,
      HttpStatus.NOT_FOUND,
      'APPOINTMENT_NOT_FOUND'
    );
  }
}

export class AppointmentConflictException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'APPOINTMENT_CONFLICT');
  }
}

export class AppointmentValidationException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'APPOINTMENT_VALIDATION_ERROR');
  }
}

export class AppointmentStateException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'APPOINTMENT_INVALID_STATE');
  }
}

// Patient domain exceptions
export class PatientNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      `Patient with identifier '${identifier}' not found`,
      HttpStatus.NOT_FOUND,
      'PATIENT_NOT_FOUND'
    );
  }
}

export class PatientValidationException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'PATIENT_VALIDATION_ERROR');
  }
}

// Psychologist domain exceptions
export class PsychologistNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      `Psychologist with identifier '${identifier}' not found`,
      HttpStatus.NOT_FOUND,
      'PSYCHOLOGIST_NOT_FOUND'
    );
  }
}

export class PsychologistNotAvailableException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'PSYCHOLOGIST_NOT_AVAILABLE');
  }
}

export class PsychologistValidationException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'PSYCHOLOGIST_VALIDATION_ERROR');
  }
}

// Business rule exceptions
export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'BUSINESS_RULE_VIOLATION');
  }
}

export class SchedulingRuleException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'SCHEDULING_RULE_VIOLATION');
  }
}

// Infrastructure exceptions
export class ExternalServiceException extends DomainException {
  constructor(service: string, message: string) {
    super(
      `External service '${service}' error: ${message}`,
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR'
    );
  }
}

export class MessageQueueException extends DomainException {
  constructor(message: string) {
    super(
      `Message queue error: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'MESSAGE_QUEUE_ERROR'
    );
  }
}

export class DatabaseConnectionException extends DomainException {
  constructor(message: string) {
    super(
      `Database connection error: ${message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'DATABASE_CONNECTION_ERROR'
    );
  }
}

// Validation helpers
export class ValidationError {
  constructor(
    public readonly field: string,
    public readonly message: string,
    public readonly value?: any
  ) {}
}

export class MultipleValidationException extends DomainException {
  constructor(public readonly errors: ValidationError[]) {
    const messages = errors.map(error => `${error.field}: ${error.message}`);
    super(
      `Validation failed: ${messages.join(', ')}`,
      HttpStatus.BAD_REQUEST,
      'MULTIPLE_VALIDATION_ERRORS'
    );
  }
}