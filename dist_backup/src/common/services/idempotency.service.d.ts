import { IdempotencyService, IdempotencyRecord } from '../interfaces/idempotency.interface';
export declare class RedisIdempotencyService implements IdempotencyService {
    private readonly logger;
    private readonly cache;
    constructor();
    store(record: IdempotencyRecord): Promise<void>;
    get(key: string, userId?: string, endpoint?: string): Promise<IdempotencyRecord | null>;
    exists(key: string, userId?: string, endpoint?: string): Promise<boolean>;
    cleanup(): Promise<void>;
    validateParameters(key: string, parameters: Record<string, unknown>, userId?: string, endpoint?: string): Promise<boolean>;
    private buildCacheKey;
    private hashParameters;
}
