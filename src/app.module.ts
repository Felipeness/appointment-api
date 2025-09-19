import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigurationModule } from './infrastructure/config/configuration.module';
import { AppointmentModule } from './appointment.module';
import { IdempotencyModule } from './common/modules/idempotency.module';
import { SecurityModule } from './common/modules/security.module';
import { TransactionalOutboxService } from './infrastructure/database/outbox/transactional-outbox.service';
import { PrismaService } from './infrastructure/database/prisma.service';
import { AwsSqsProducer } from './infrastructure/messaging/aws-sqs.producer';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration with environment validation
    ConfigurationModule,

    // Schedule module for cron jobs (outbox processing)
    ScheduleModule.forRoot(),

    // Feature modules
    AppointmentModule,
    IdempotencyModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TransactionalOutboxService,
    PrismaService,
    AwsSqsProducer,
  ],
})
export class AppModule {}
