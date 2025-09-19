export declare class WorkingHours {
    readonly startTime: string;
    readonly endTime: string;
    readonly workingDays: number[];
    constructor(data: string | {
        startTime: string;
        endTime: string;
        workingDays: number[];
    });
    private validate;
    private isValidTime;
    isWorkingDay(date: Date): boolean;
    isWithinWorkingHours(time: string): boolean;
    isAvailableAt(dateTime: Date): boolean;
}
