import { Id } from '../base/value-object.base';
export declare class PatientId extends Id {
    constructor(value: string);
    static create(value?: string): PatientId;
    static fromString(value: string): PatientId;
}
