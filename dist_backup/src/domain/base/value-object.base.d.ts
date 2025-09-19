import { z } from 'zod';
export declare abstract class ValueObject<T> {
    protected readonly props: T;
    constructor(props: T);
    equals(vo?: ValueObject<T>): boolean;
    getValue(): T;
}
export declare const IdSchema: z.ZodString;
export declare class Id extends ValueObject<string> {
    constructor(value: string);
    toString(): string;
    static create(value?: string): Id;
}
