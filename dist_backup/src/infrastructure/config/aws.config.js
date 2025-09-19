"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('aws', () => ({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpointUrl: process.env.AWS_ENDPOINT_URL,
    sqsQueueUrl: process.env.SQS_APPOINTMENT_QUEUE_URL,
}));
//# sourceMappingURL=aws.config.js.map