import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import awsConfig from './aws.config';
import { join } from 'path';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
      load: [awsConfig],
      envFilePath: [
        join(process.cwd(), `.env.${process.env.NODE_ENV ?? 'development'}`),
        join(process.cwd(), '.env'),
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigurationModule {}
