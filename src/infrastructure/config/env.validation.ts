import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // AWS Configuration
  AWS_REGION: z.string().min(1).default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SQS_APPOINTMENT_QUEUE_URL: z.string().url(),

  // Redis Configuration
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Security & Rate Limiting
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // SQS Tuning
  SQS_VISIBILITY_TIMEOUT: z.coerce.number().int().positive().default(300),
  SQS_BATCH_SIZE: z.coerce.number().int().min(1).max(10).default(10),
  SQS_WAIT_TIME: z.coerce.number().int().min(0).max(20).default(20),
  SQS_MAX_RECEIVE_COUNT: z.coerce.number().int().positive().default(3),

  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  CORRELATION_ID_HEADER: z.string().default('x-correlation-id'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues
        .filter(
          (e) =>
            e.code === 'invalid_type' && (e as any).received === 'undefined',
        )
        .map((e) => e.path.join('.'));

      const invalidFields = error.issues
        .filter(
          (e) =>
            e.code !== 'invalid_type' || (e as any).received !== 'undefined',
        )
        .map((e) => `${e.path.join('.')}: ${e.message}`);

      console.error('❌ Environment validation failed:');

      if (missingFields.length > 0) {
        console.error('Missing required environment variables:', missingFields);
      }

      if (invalidFields.length > 0) {
        console.error('Invalid environment variables:', invalidFields);
      }

      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment
export const env = validateEnv();
