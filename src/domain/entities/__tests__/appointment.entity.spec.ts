import { Appointment } from '../appointment.entity';
import { AppointmentStatus } from '../enums';
import { addHours, subHours } from 'date-fns';

describe('Appointment Entity', () => {
  const validAppointment = {
    id: 'appointment-id',
    patientId: 'patient-id',
    psychologistId: 'psychologist-id',
    scheduledAt: addHours(new Date(), 25),
  };

  describe('constructor', () => {
    it('should create a valid appointment', () => {
      const appointment = new Appointment(
        validAppointment.id,
        validAppointment.patientId,
        validAppointment.psychologistId,
        validAppointment.scheduledAt,
      );

      expect(appointment.id).toBe(validAppointment.id);
      expect(appointment.patientId).toBe(validAppointment.patientId);
      expect(appointment.psychologistId).toBe(validAppointment.psychologistId);
      expect(appointment.scheduledAt).toBe(validAppointment.scheduledAt);
      expect(appointment.status).toBe(AppointmentStatus.PENDING);
    });

    it('should throw error when id is missing', () => {
      expect(() => {
        new Appointment(
          '',
          validAppointment.patientId,
          validAppointment.psychologistId,
          validAppointment.scheduledAt,
        );
      }).toThrow('Appointment ID is required');
    });

    it('should throw error when patient and psychologist are the same', () => {
      expect(() => {
        new Appointment(
          validAppointment.id,
          'same-id',
          'same-id',
          validAppointment.scheduledAt,
        );
      }).toThrow('Patient and psychologist cannot be the same person');
    });
  });

  describe('business rules', () => {
    let appointment: Appointment;

    beforeEach(() => {
      appointment = new Appointment(
        validAppointment.id,
        validAppointment.patientId,
        validAppointment.psychologistId,
        validAppointment.scheduledAt,
      );
    });

    describe('isScheduledWithin24Hours', () => {
      it('should return true when scheduled within 24 hours', () => {
        const soonAppointment = new Appointment(
          'id',
          'patient',
          'psychologist',
          addHours(new Date(), 12),
        );

        expect(soonAppointment.isScheduledWithin24Hours()).toBe(true);
      });

      it('should return false when scheduled after 24 hours', () => {
        expect(appointment.isScheduledWithin24Hours()).toBe(false);
      });
    });

    describe('isPast', () => {
      it('should return true for past appointments', () => {
        const pastAppointment = new Appointment(
          'id',
          'patient',
          'psychologist',
          subHours(new Date(), 1),
        );

        expect(pastAppointment.isPast()).toBe(true);
      });

      it('should return false for future appointments', () => {
        expect(appointment.isPast()).toBe(false);
      });
    });
  });

  describe('state transitions', () => {
    let appointment: Appointment;

    beforeEach(() => {
      appointment = new Appointment(
        validAppointment.id,
        validAppointment.patientId,
        validAppointment.psychologistId,
        validAppointment.scheduledAt,
      );
    });

    describe('confirm', () => {
      it('should confirm pending appointment', () => {
        const confirmed = appointment.confirm('Confirmed by psychologist');

        expect(confirmed.status).toBe(AppointmentStatus.CONFIRMED);
        expect(confirmed.notes).toBe('Confirmed by psychologist');
      });

      it('should throw error when confirming non-pending appointment', () => {
        const confirmed = appointment.confirm();

        expect(() => {
          confirmed.confirm();
        }).toThrow('Appointment cannot be confirmed in current state');
      });
    });

    describe('decline', () => {
      it('should decline pending appointment', () => {
        const declined = appointment.decline('Not available');

        expect(declined.status).toBe(AppointmentStatus.DECLINED);
        expect(declined.notes).toBe('Not available');
      });
    });

    describe('cancel', () => {
      it('should cancel confirmed appointment', () => {
        const confirmed = appointment.confirm();
        const cancelled = confirmed.cancel('patient', 'Patient cancelled');

        expect(cancelled.status).toBe(AppointmentStatus.CANCELLED);
        expect(cancelled.cancelledBy).toBe('patient');
        expect(cancelled.cancellationReason).toBe('Patient cancelled');
      });
    });
  });
});
