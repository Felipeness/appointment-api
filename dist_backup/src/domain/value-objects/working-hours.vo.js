"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkingHours = void 0;
class WorkingHours {
    startTime;
    endTime;
    workingDays;
    constructor(data) {
        if (typeof data === 'string') {
            const parsed = JSON.parse(data ||
                '{"startTime": "09:00", "endTime": "17:00", "workingDays": [1,2,3,4,5]}');
            this.startTime = parsed.startTime || '09:00';
            this.endTime = parsed.endTime || '17:00';
            this.workingDays = parsed.workingDays || [1, 2, 3, 4, 5];
        }
        else {
            this.startTime = data.startTime;
            this.endTime = data.endTime;
            this.workingDays = data.workingDays;
        }
        this.validate();
    }
    validate() {
        if (!this.isValidTime(this.startTime)) {
            throw new Error('Invalid start time format. Expected HH:MM');
        }
        if (!this.isValidTime(this.endTime)) {
            throw new Error('Invalid end time format. Expected HH:MM');
        }
        if (this.startTime >= this.endTime) {
            throw new Error('Start time must be before end time');
        }
        if (this.workingDays.length === 0) {
            throw new Error('At least one working day must be specified');
        }
        if (!this.workingDays.every((day) => day >= 0 && day <= 6)) {
            throw new Error('Working days must be between 0 (Sunday) and 6 (Saturday)');
        }
    }
    isValidTime(time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    isWorkingDay(date) {
        return this.workingDays.includes(date.getDay());
    }
    isWithinWorkingHours(time) {
        return time >= this.startTime && time <= this.endTime;
    }
    isAvailableAt(dateTime) {
        const time = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
        return this.isWorkingDay(dateTime) && this.isWithinWorkingHours(time);
    }
}
exports.WorkingHours = WorkingHours;
//# sourceMappingURL=working-hours.vo.js.map