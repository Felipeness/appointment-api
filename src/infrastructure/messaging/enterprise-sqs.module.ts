import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from '@ssut/nestjs-sqs';
import { EnterpriseAppointmentProducer } from './enterprise-appointment.producer';

interface AwsConfig {
  sqsQueueUrl: string;
  region: string;
  dlqArn?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpointUrl?: string; // For LocalStack
}

@Module({
  imports: [
    ConfigModule,
    SqsModule.registerAsync({
      imports: [ConfigModule],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => {
        const awsConfig = configService.get<AwsConfig>('aws');

        if (!awsConfig) {
          throw new Error('AWS configuration is required');
        }

        return {
          consumers: [
            {
              name: 'appointment-consumer',
              queueUrl: awsConfig.sqsQueueUrl,
              region: awsConfig.region,
              // Tuned for throughput and reliability (configurable)
              batchSize: Number(process.env.SQS_BATCH_SIZE) || 10,
              visibilityTimeoutSeconds:
                Number(process.env.SQS_VISIBILITY_TIMEOUT) || 300,
              waitTimeSeconds: Number(process.env.SQS_WAIT_TIME) || 20, // Long polling
              maxReceiveCount: Number(process.env.SQS_MAX_RECEIVE_COUNT) || 3,
              // Advanced configurations for high throughput
              messageRetentionPeriod: 1209600, // 14 days
              receiveMessageWaitTimeSeconds:
                Number(process.env.SQS_WAIT_TIME) || 20,
              reddrivePolicy: awsConfig.dlqArn
                ? {
                    deadLetterTargetArn: awsConfig.dlqArn,
                    maxReceiveCount:
                      Number(process.env.SQS_MAX_RECEIVE_COUNT) || 3,
                  }
                : undefined,
            },
          ],
          producers: [
            {
              name: 'appointment-producer',
              queueUrl: awsConfig.sqsQueueUrl,
              region: awsConfig.region,
              // Producer optimizations
              maxRetries: 5,
              retryDelayOptions: {
                base: 1000,
                customBackoff: (retryCount: number) => {
                  // Exponential backoff with jitter
                  return (
                    Math.floor(Math.random() * 1000) +
                    Math.pow(2, retryCount) * 1000
                  );
                },
              },
            },
          ],
          // Global SQS configurations
          awsConfig: {
            region: awsConfig.region,
            ...(awsConfig.endpointUrl ? { endpoint: awsConfig.endpointUrl } : {}),
            // Use default credential provider chain (AWS CLI, environment, IAM role, etc.)
            ...(awsConfig.accessKeyId && awsConfig.secretAccessKey
              ? {
                  credentials: {
                    accessKeyId: awsConfig.accessKeyId,
                    secretAccessKey: awsConfig.secretAccessKey,
                  },
                }
              : {}),
          },
        };
      },
      inject: [ConfigService],
    }),
    // Import AppointmentModule without circular dependency
  ],
  providers: [
    EnterpriseAppointmentProducer,
    // Note: EnterpriseAppointmentConsumer is provided by @SqsMessageHandler decorator
    // and its dependencies should be resolved from the main AppointmentModule
  ],
  exports: [EnterpriseAppointmentProducer],
})
export class EnterpriseSqsModule {}
