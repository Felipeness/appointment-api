import { validate } from 'class-validator';
import { CreateAppointmentDto } from '../create-appointment.dto';
import { plainToClass } from 'class-transformer';
import { addHours } from 'date-fns';

describe('CreateAppointmentDto', () => {
  const validData = {
    patientEmail: 'patient@test.com',
    patientName: 'John Doe',
    psychologistId: 'valid-psychologist-id',
    scheduledAt: addHours(new Date(), 25).toISOString(),
    patientPhone: '+55 11 99999-9999',
    notes: 'First consultation',
  };

  describe('valid data', () => {
    it('should pass validation with all valid fields', async () => {
      const dto = plainToClass(CreateAppointmentDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional fields', async () => {
      const {
        patientPhone: _patientPhone, // eslint-disable-line @typescript-eslint/no-unused-vars
        notes: _notes, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...requiredData
      } = validData;
      const dto = plainToClass(CreateAppointmentDto, requiredData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('email validation', () => {
    it('should fail validation with invalid email', async () => {
      const invalidData = { ...validData, patientEmail: 'invalid-email' };
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('patientEmail');
    });

    it('should fail validation with missing email', async () => {
      const { patientEmail: _patientEmail, ...invalidData } = validData; // eslint-disable-line @typescript-eslint/no-unused-vars
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('patientEmail');
    });
  });

  describe('name validation', () => {
    it('should fail validation with missing name', async () => {
      const { patientName: _patientName, ...invalidData } = validData; // eslint-disable-line @typescript-eslint/no-unused-vars
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('patientName');
    });

    it('should fail validation with empty name', async () => {
      const invalidData = { ...validData, patientName: '' };
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('patientName');
    });
  });

  describe('psychologist ID validation', () => {
    it('should fail validation with missing psychologist ID', async () => {
      const { psychologistId: _psychologistId, ...invalidData } = validData; // eslint-disable-line @typescript-eslint/no-unused-vars
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('psychologistId');
    });
  });

  describe('scheduled date validation', () => {
    it('should fail validation with invalid date format', async () => {
      const invalidData = { ...validData, scheduledAt: 'invalid-date' };
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('scheduledAt');
    });

    it('should fail validation with missing scheduled date', async () => {
      const { scheduledAt: _scheduledAt, ...invalidData } = validData; // eslint-disable-line @typescript-eslint/no-unused-vars
      const dto = plainToClass(CreateAppointmentDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('scheduledAt');
    });
  });
});
