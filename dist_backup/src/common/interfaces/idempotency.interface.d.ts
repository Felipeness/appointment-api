export interface IdempotencyRecord {
    key: string;
    userId?: string;
    endpoint: string;
    method: string;
    parameters: Record<string, any>;
    response: {
        statusCode: number;
        body: any;
        headers?: Record<string, string>;
    };
    createdAt: Date;
    expiresAt: Date;
}
export interface IdempotencyService {
    store(record: IdempotencyRecord): Promise<void>;
    get(key: string, userId?: string, endpoint?: string): Promise<IdempotencyRecord | null>;
    exists(key: string, userId?: string, endpoint?: string): Promise<boolean>;
    cleanup(): Promise<void>;
    validateParameters(key: string, parameters: Record<string, unknown>, userId?: string, endpoint?: string): Promise<boolean>;
}
export interface IdempotencyKeyGenerator {
    generate(context?: Record<string, any>): string;
    validate(key: string): boolean;
}
