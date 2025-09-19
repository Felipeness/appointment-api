import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsSqsProducer } from './aws-sqs.producer';

@Module({
  imports: [ConfigModule],
  providers: [AwsSqsProducer],
  exports: [AwsSqsProducer],
})
export class EnterpriseSqsModule {}
