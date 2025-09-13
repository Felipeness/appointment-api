import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsSqsProducer } from './aws-sqs.producer';

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
  ],
  providers: [
    AwsSqsProducer,
  ],
  exports: [AwsSqsProducer],
})
export class EnterpriseSqsModule {}
