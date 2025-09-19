export declare class DateService {
    static addHours(date: Date, hours: number): Date;
    static isBefore(date1: Date, date2: Date): boolean;
    static isAfter(date1: Date, date2: Date): boolean;
    static now(): Date;
    static addMinutes(date: Date, minutes: number): Date;
    static differenceInMinutes(laterDate: Date, earlierDate: Date): number;
    static isToday(date: Date): boolean;
    static isWeekend(date: Date): boolean;
}
