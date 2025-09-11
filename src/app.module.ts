import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import awsConfig from './infrastructure/config/aws.config';
import databaseConfig from './infrastructure/config/database.config';
import redisConfig from './infrastructure/config/redis.config';

import { AppointmentModule } from './appointment.module';
import { IdempotencyModule } from './common/modules/idempotency.module';
import { SecurityModule } from './common/modules/security.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [awsConfig, databaseConfig, redisConfig],
    }),
    AppointmentModule,
    IdempotencyModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
