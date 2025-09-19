export declare const IDEMPOTENCY_KEY = "idempotency_key";
export interface IdempotencyOptions {
    ttl?: number;
    scope?: string;
    validateParameters?: boolean;
}
export declare const Idempotent: (options?: IdempotencyOptions) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
