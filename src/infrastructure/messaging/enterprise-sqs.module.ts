import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule } from '@ssut/nestjs-sqs';
import { EnterpriseAppointmentProducer } from './enterprise-appointment.producer';

@Module({
  imports: [
    ConfigModule,
    SqsModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const awsConfig = configService.get('aws');
        
        return {
          consumers: [
            {
              name: 'appointment-consumer',
              queueUrl: awsConfig.sqsQueueUrl,
              region: awsConfig.region,
              // Enterprise-grade configurations
              batchSize: 10, // Process up to 10 messages at once
              visibilityTimeoutSeconds: 300, // 5 minutes to process
              waitTimeSeconds: 20, // Long polling
              maxReceiveCount: 3, // Max retries before DLQ
              // Advanced configurations for high throughput
              messageRetentionPeriod: 1209600, // 14 days
              receiveMessageWaitTimeSeconds: 20,
              reddrivePolicy: {
                deadLetterTargetArn: awsConfig.dlqArn,
                maxReceiveCount: 3,
              },
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
                  return Math.floor(Math.random() * 1000) + Math.pow(2, retryCount) * 1000;
                },
              },
            },
          ],
          // Global SQS configurations
          awsConfig: {
            region: awsConfig.region,
            // Use default credential provider chain (AWS CLI, environment, IAM role, etc.)
            ...(awsConfig.accessKeyId && awsConfig.secretAccessKey ? {
              credentials: {
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey,
              }
            } : {})
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