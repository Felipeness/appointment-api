import { Id } from '../base/value-object.base';
export declare class PsychologistId extends Id {
    constructor(value: string);
    static create(value?: string): PsychologistId;
    static fromString(value: string): PsychologistId;
}
