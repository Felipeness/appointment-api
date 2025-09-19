declare const _default: (() => {
    region: string;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    endpointUrl: string | undefined;
    sqsQueueUrl: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    region: string;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    endpointUrl: string | undefined;
    sqsQueueUrl: string | undefined;
}>;
export default _default;
