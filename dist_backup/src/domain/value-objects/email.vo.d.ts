import { ValueObject } from '../base/value-object.base';
export declare class Email extends ValueObject<string> {
    constructor(value: string);
    static create(email: string): Email;
    getValue(): string;
    toString(): string;
    getDomain(): string;
    getLocalPart(): string;
}
