"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateService = void 0;
class DateService {
    static addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }
    static isBefore(date1, date2) {
        return date1.getTime() < date2.getTime();
    }
    static isAfter(date1, date2) {
        return date1.getTime() > date2.getTime();
    }
    static now() {
        return new Date();
    }
    static addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }
    static differenceInMinutes(laterDate, earlierDate) {
        return Math.floor((laterDate.getTime() - earlierDate.getTime()) / (1000 * 60));
    }
    static isToday(date) {
        const today = new Date();
        return (date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear());
    }
    static isWeekend(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
}
exports.DateService = DateService;
//# sourceMappingURL=date.service.js.map