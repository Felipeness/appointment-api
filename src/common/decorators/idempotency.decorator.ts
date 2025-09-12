import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const IDEMPOTENCY_KEY = 'idempotency_key';

export interface IdempotencyOptions {
  ttl?: number; // TTL in seconds, default 86400 (24 hours)
  scope?: string; // Scope for the idempotency key (e.g., user-specific)
  validateParameters?: boolean; // Whether to validate parameters match original request
}

export const Idempotent = (options: IdempotencyOptions = {}) => {
  const defaultOptions: Required<IdempotencyOptions> = {
    ttl: 86400, // 24 hours
    scope: 'global',
    validateParameters: true,
    ...options,
  };

  return applyDecorators(
    SetMetadata(IDEMPOTENCY_KEY, defaultOptions),
    ApiHeader({
      name: 'Idempotency-Key',
      description:
        'Unique key to ensure idempotent request processing. Use UUIDs or similar unique identifiers.',
      required: false,
      example: '550e8400-e29b-41d4-a716-446655440000',
      schema: {
        type: 'string',
        maxLength: 255,
        pattern: '^[a-zA-Z0-9_-]+$',
      },
    }),
  );
};
