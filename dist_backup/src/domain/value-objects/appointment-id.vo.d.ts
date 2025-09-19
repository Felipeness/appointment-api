import { Id } from '../base/value-object.base';
export declare class AppointmentId extends Id {
    constructor(value: string);
    static create(value?: string): AppointmentId;
    static fromString(value: string): AppointmentId;
}
