import { HttpStatus } from '@nestjs/common';
import {
  AppointmentNotFoundException,
  AppointmentConflictException,
  AppointmentValidationException,
  PatientNotFoundException,
  PsychologistNotFoundException,
  PsychologistNotAvailableException,
  BusinessRuleException,
  SchedulingRuleException,
  MultipleValidationException,
  ValidationError,
} from '../domain.exceptions';

describe('Domain Exceptions', () => {
  describe('AppointmentNotFoundException', () => {
    it('should create exception with correct message and code', () => {
      const appointmentId = 'test-appointment-id';
      const exception = new AppointmentNotFoundException(appointmentId);

      expect(exception.message).toBe(`Appointment with ID '${appointmentId}' not found`);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.code).toBe('APPOINTMENT_NOT_FOUND');
      expect(exception.name).toBe('AppointmentNotFoundException');
    });
  });

  describe('AppointmentConflictException', () => {
    it('should create exception with correct properties', () => {
      const message = 'Time slot is already booked';
      const exception = new AppointmentConflictException(message);

      expect(exception.message).toBe(message);
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.code).toBe('APPOINTMENT_CONFLICT');
    });
  });

  describe('AppointmentValidationException', () => {
    it('should create exception with correct properties', () => {
      const message = 'Invalid appointment data';
      const exception = new AppointmentValidationException(message);

      expect(exception.message).toBe(message);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe('APPOINTMENT_VALIDATION_ERROR');
    });
  });

  describe('PatientNotFoundException', () => {
    it('should create exception with patient identifier', () => {
      const patientId = 'patient-123';
      const exception = new PatientNotFoundException(patientId);

      expect(exception.message).toBe(`Patient with identifier '${patientId}' not found`);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.code).toBe('PATIENT_NOT_FOUND');
    });
  });

  describe('PsychologistNotFoundException', () => {
    it('should create exception with psychologist identifier', () => {
      const psychologistId = 'psych-123';
      const exception = new PsychologistNotFoundException(psychologistId);

      expect(exception.message).toBe(`Psychologist with identifier '${psychologistId}' not found`);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.code).toBe('PSYCHOLOGIST_NOT_FOUND');
    });
  });

  describe('PsychologistNotAvailableException', () => {
    it('should create exception with custom message', () => {
      const message = 'Psychologist is not available at this time';
      const exception = new PsychologistNotAvailableException(message);

      expect(exception.message).toBe(message);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe('PSYCHOLOGIST_NOT_AVAILABLE');
    });
  });

  describe('BusinessRuleException', () => {
    it('should create exception for business rule violations', () => {
      const message = 'Business rule violated';
      const exception = new BusinessRuleException(message);

      expect(exception.message).toBe(message);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe('BUSINESS_RULE_VIOLATION');
    });
  });

  describe('SchedulingRuleException', () => {
    it('should create exception for scheduling rule violations', () => {
      const message = 'Appointments must be scheduled 24 hours in advance';
      const exception = new SchedulingRuleException(message);

      expect(exception.message).toBe(message);
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe('SCHEDULING_RULE_VIOLATION');
    });
  });

  describe('MultipleValidationException', () => {
    it('should create exception with multiple validation errors', () => {
      const errors = [
        new ValidationError('email', 'Email is required'),
        new ValidationError('name', 'Name must be at least 2 characters'),
        new ValidationError('phone', 'Invalid phone format'),
      ];
      
      const exception = new MultipleValidationException(errors);

      expect(exception.message).toBe(
        'Validation failed: email: Email is required, name: Name must be at least 2 characters, phone: Invalid phone format'
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe('MULTIPLE_VALIDATION_ERRORS');
      expect(exception.errors).toEqual(errors);
    });

    it('should handle single validation error', () => {
      const errors = [new ValidationError('email', 'Email is required')];
      const exception = new MultipleValidationException(errors);

      expect(exception.message).toBe('Validation failed: email: Email is required');
      expect(exception.errors).toHaveLength(1);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field and message', () => {
      const field = 'email';
      const message = 'Email is required';
      const value = null;
      
      const error = new ValidationError(field, message, value);

      expect(error.field).toBe(field);
      expect(error.message).toBe(message);
      expect(error.value).toBe(value);
    });

    it('should create validation error without value', () => {
      const field = 'name';
      const message = 'Name is required';
      
      const error = new ValidationError(field, message);

      expect(error.field).toBe(field);
      expect(error.message).toBe(message);
      expect(error.value).toBeUndefined();
    });
  });
});