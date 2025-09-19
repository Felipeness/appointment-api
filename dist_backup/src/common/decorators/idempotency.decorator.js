"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Idempotent = exports.IDEMPOTENCY_KEY = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
exports.IDEMPOTENCY_KEY = 'idempotency_key';
const Idempotent = (options = {}) => {
    const defaultOptions = {
        ttl: 86400,
        scope: 'global',
        validateParameters: true,
        ...options,
    };
    return (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.IDEMPOTENCY_KEY, defaultOptions), (0, swagger_1.ApiHeader)({
        name: 'Idempotency-Key',
        description: 'Unique key to ensure idempotent request processing. Use UUIDs or similar unique identifiers.',
        required: false,
        example: '550e8400-e29b-41d4-a716-446655440000',
        schema: {
            type: 'string',
            maxLength: 255,
            pattern: '^[a-zA-Z0-9_-]+$',
        },
    }));
};
exports.Idempotent = Idempotent;
//# sourceMappingURL=idempotency.decorator.js.map