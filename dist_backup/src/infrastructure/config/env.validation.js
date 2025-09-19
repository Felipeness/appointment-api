"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    AWS_REGION: zod_1.z.string().min(1).default('us-east-1'),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_ENDPOINT_URL: zod_1.z.string().url().optional(),
    SQS_APPOINTMENT_QUEUE_URL: zod_1.z.string().url(),
    SQS_APPOINTMENT_DLQ_URL: zod_1.z.string().url().optional(),
    REDIS_HOST: zod_1.z.string().min(1).default('localhost'),
    REDIS_PORT: zod_1.z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    RATE_LIMIT_TTL: zod_1.z.coerce.number().int().positive().default(60),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(100),
    SQS_VISIBILITY_TIMEOUT: zod_1.z.coerce.number().int().positive().default(300),
    SQS_BATCH_SIZE: zod_1.z.coerce.number().int().min(1).max(10).default(10),
    SQS_WAIT_TIME: zod_1.z.coerce.number().int().min(0).max(20).default(20),
    SQS_MAX_RECEIVE_COUNT: zod_1.z.coerce.number().int().positive().default(3),
    OTEL_EXPORTER_OTLP_ENDPOINT: zod_1.z.string().url().optional(),
    CORRELATION_ID_HEADER: zod_1.z.string().default('x-correlation-id'),
});
function validateEnv() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingFields = error.issues
                .filter((e) => e.code === 'invalid_type' &&
                'received' in e &&
                e.received === 'undefined')
                .map((e) => e.path.join('.'));
            const invalidFields = error.issues
                .filter((e) => e.code !== 'invalid_type' ||
                !('received' in e) ||
                e.received !== 'undefined')
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
exports.env = validateEnv();
//# sourceMappingURL=env.validation.js.map