import { WorkingHours } from '../working-hours.vo';

describe('WorkingHours Value Object', () => {
  describe('constructor', () => {
    it('should create valid working hours', () => {
      const workingHours = new WorkingHours({ startTime: '08:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5] });

      expect(workingHours.startTime).toBe('08:00');
      expect(workingHours.endTime).toBe('18:00');
      expect(workingHours.workingDays).toEqual([1, 2, 3, 4, 5]);
    });

    it('should throw error for invalid start time format', () => {
      expect(() => {
        new WorkingHours({ startTime: '25:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5] });
      }).toThrow('Invalid start time format. Expected HH:MM');
    });

    it('should throw error for invalid end time format', () => {
      expect(() => {
        new WorkingHours({ startTime: '08:00', endTime: '25:00', workingDays: [1, 2, 3, 4, 5] });
      }).toThrow('Invalid end time format. Expected HH:MM');
    });

    it('should throw error when start time is after end time', () => {
      expect(() => {
        new WorkingHours({ startTime: '18:00', endTime: '08:00', workingDays: [1, 2, 3, 4, 5] });
      }).toThrow('Start time must be before end time');
    });

    it('should throw error for empty working days', () => {
      expect(() => {
        new WorkingHours({ startTime: '08:00', endTime: '18:00', workingDays: [] });
      }).toThrow('At least one working day must be specified');
    });

    it('should throw error for invalid working day', () => {
      expect(() => {
        new WorkingHours({ startTime: '08:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 7] });
      }).toThrow('Working days must be between 0 (Sunday) and 6 (Saturday)');
    });
  });

  describe('isWorkingDay', () => {
    const workingHours = new WorkingHours({ startTime: '08:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5] });

    it('should return true for Monday (1)', () => {
      const monday = new Date('2024-01-01'); // Monday
      expect(workingHours.isWorkingDay(monday)).toBe(true);
    });

    it('should return false for Sunday (0)', () => {
      const sunday = new Date('2023-12-31'); // Sunday
      expect(workingHours.isWorkingDay(sunday)).toBe(false);
    });
  });

  describe('isWithinWorkingHours', () => {
    const workingHours = new WorkingHours({ startTime: '08:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5] });

    it('should return true for time within working hours', () => {
      expect(workingHours.isWithinWorkingHours('10:00')).toBe(true);
    });

    it('should return false for time before working hours', () => {
      expect(workingHours.isWithinWorkingHours('07:00')).toBe(false);
    });

    it('should return false for time after working hours', () => {
      expect(workingHours.isWithinWorkingHours('19:00')).toBe(false);
    });
  });

  describe('isAvailableAt', () => {
    const workingHours = new WorkingHours({ startTime: '08:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5] });

    it('should return true for working day within working hours', () => {
      const mondayMorning = new Date('2024-01-01 10:00:00'); // Monday 10:00
      expect(workingHours.isAvailableAt(mondayMorning)).toBe(true);
    });

    it('should return false for non-working day', () => {
      const sundayMorning = new Date('2023-12-31 10:00:00'); // Sunday 10:00
      expect(workingHours.isAvailableAt(sundayMorning)).toBe(false);
    });

    it('should return false for working day outside working hours', () => {
      const mondayEvening = new Date('2024-01-01 20:00:00'); // Monday 20:00
      expect(workingHours.isAvailableAt(mondayEvening)).toBe(false);
    });
  });
});