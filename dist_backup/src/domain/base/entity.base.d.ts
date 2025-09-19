export declare abstract class Entity<T = unknown> {
    protected readonly _id: string;
    protected readonly props: T;
    constructor(props: T, id?: string);
    get id(): string;
    equals(object?: Entity<T>): boolean;
    private generateId;
}
