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
  /**
   * Store an idempotency record
   */
  store(record: IdempotencyRecord): Promise<void>;

  /**
   * Retrieve an idempotency record by key
   */
  get(
    key: string,
    userId?: string,
    endpoint?: string,
  ): Promise<IdempotencyRecord | null>;

  /**
   * Check if a key exists and is valid
   */
  exists(key: string, userId?: string, endpoint?: string): Promise<boolean>;

  /**
   * Remove expired records
   */
  cleanup(): Promise<void>;

  /**
   * Validate parameters match the original request
   */
  validateParameters(
    key: string,
    parameters: Record<string, unknown>,
    userId?: string,
    endpoint?: string,
  ): Promise<boolean>;
}

export interface IdempotencyKeyGenerator {
  /**
   * Generate a unique idempotency key
   */
  generate(context?: Record<string, any>): string;

  /**
   * Validate idempotency key format
   */
  validate(key: string): boolean;
}
