import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';

import { EnterpriseScheduleAppointmentUseCase } from '../../application/use-cases/enterprise-schedule-appointment.use-case';
import { CreateAppointmentDto } from '../../application/dtos/create-appointment.dto';
import { Idempotent } from '../../common/decorators/idempotency.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import {
  RateLimit,
  RateLimitGuard,
} from '../../common/guards/rate-limit.guard';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(
    private readonly enterpriseScheduleUseCase: EnterpriseScheduleAppointmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(IdempotencyInterceptor)
  @UseGuards(RateLimitGuard)
  @Idempotent({ ttl: 3600, scope: 'user', validateParameters: true })
  @RateLimit({ points: 10, duration: 60, blockDuration: 300 }) // 10 requests per minute, block for 5 minutes
  @ApiOperation({
    summary: 'Schedule a new appointment (Enterprise)',
    description:
      'Creates a new appointment request with enterprise features including priority processing, distributed tracing, and intelligent queueing. The appointment will be validated and confirmed/declined asynchronously.',
  })
  @ApiBody({
    description: 'Appointment details',
    type: CreateAppointmentDto,
  })
  @ApiHeader({
    name: 'x-trace-id',
    description: 'Optional trace ID for distributed tracing',
    required: false,
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'Optional user ID for auditing',
    required: false,
  })
  @ApiQuery({
    name: 'priority',
    description:
      'Message priority: high (immediate), normal (5s delay), low (10s delay)',
    required: false,
    enum: ['high', 'normal', 'low'],
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Appointment request accepted and queued for enterprise processing',
    schema: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          example: 'clx123456789',
          description: 'Generated appointment ID',
        },
        status: {
          type: 'string',
          example: 'queued',
          description: 'Current status of the appointment request',
        },
        queuedAt: {
          type: 'string',
          example: '2024-01-15T10:00:00.000Z',
          description: 'Timestamp when request was queued',
        },
        estimatedProcessingTime: {
          type: 'string',
          example: '2024-01-15T10:05:00.000Z',
          description: 'Estimated processing completion time based on priority',
        },
        traceId: {
          type: 'string',
          example: 'trace_1234567890_abc123',
          description: 'Distributed tracing ID for monitoring',
        },
        priority: {
          type: 'string',
          example: 'normal',
          description: 'Assigned priority level',
        },
        message: {
          type: 'string',
          example: 'Appointment request queued for enterprise processing',
          description: 'Status message',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or business rule violation',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Appointments must be scheduled at least 24 hours in advance',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Psychologist not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Psychologist not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async scheduleAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Headers('x-trace-id') traceId?: string,
    @Headers('x-user-id') userId?: string,
    @Query('priority') priority?: 'high' | 'normal' | 'low',
  ) {
    const startTime = Date.now();

    this.logger.log(`Received enterprise appointment request`, {
      psychologistId: createAppointmentDto.psychologistId,
      patientEmail: createAppointmentDto.patientEmail,
      scheduledAt: createAppointmentDto.scheduledAt,
      priority: priority ?? 'auto-determined',
      traceId,
      userId,
    });

    try {
      const result = await this.enterpriseScheduleUseCase.execute(
        createAppointmentDto,
        {
          priority,
          traceId,
          userId,
        },
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(`Enterprise appointment request processed successfully`, {
        appointmentId: result.appointmentId,
        status: result.status,
        priority: result.priority,
        traceId: result.traceId,
        processingTimeMs: processingTime,
      });

      return {
        ...result,
        message:
          result.status === 'queued'
            ? 'Appointment request queued for enterprise processing'
            : 'Appointment request failed validation',
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Enterprise appointment request failed`, {
        psychologistId: createAppointmentDto.psychologistId,
        error: errorMessage,
        traceId,
        processingTimeMs: processingTime,
        stack: errorStack,
      });

      // Re-throw for global exception handler to process
      throw error;
    }
  }

  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(IdempotencyInterceptor)
  @UseGuards(RateLimitGuard)
  @Idempotent({ ttl: 3600, scope: 'user', validateParameters: true })
  @RateLimit({ points: 5, duration: 300, blockDuration: 600 }) // 5 batch requests per 5 minutes, block for 10 minutes
  @ApiOperation({
    summary: 'Schedule multiple appointments (Enterprise Batch)',
    description:
      'Creates multiple appointment requests in a single batch operation with enterprise features. Optimized for high-volume scenarios.',
  })
  @ApiBody({
    description: 'Array of appointment details',
    schema: {
      type: 'object',
      properties: {
        appointments: {
          type: 'array',
          items: { $ref: '#/components/schemas/CreateAppointmentDto' },
        },
      },
    },
  })
  @ApiHeader({
    name: 'x-trace-id',
    description: 'Optional trace ID for distributed tracing',
    required: false,
  })
  @ApiQuery({
    name: 'priority',
    description: 'Batch priority level',
    required: false,
    enum: ['high', 'normal', 'low'],
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Batch appointment requests processed',
    schema: {
      type: 'object',
      properties: {
        batchId: { type: 'string' },
        totalRequests: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              appointmentId: { type: 'string' },
              status: { type: 'string' },
              traceId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async scheduleAppointmentsBatch(
    @Body() batchRequest: { appointments: CreateAppointmentDto[] },
    @Headers('x-trace-id') traceId?: string,
    @Query('priority') priority?: 'high' | 'normal' | 'low',
  ) {
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`Received enterprise batch appointment request`, {
      batchId,
      appointmentCount: batchRequest.appointments.length,
      priority: priority ?? 'auto-determined',
      traceId,
    });

    try {
      const results = await this.enterpriseScheduleUseCase.executeBatch(
        batchRequest.appointments,
        {
          priority,
          traceId,
          batchId,
        },
      );

      const processingTime = Date.now() - startTime;
      const successful = results.filter((r) => r.status === 'queued').length;
      const failed = results.filter((r) => r.status === 'failed').length;

      this.logger.log(`Enterprise batch appointment request processed`, {
        batchId,
        totalRequests: results.length,
        successful,
        failed,
        processingTimeMs: processingTime,
      });

      return {
        batchId,
        totalRequests: results.length,
        successful,
        failed,
        results,
        message: `Batch processed: ${successful} queued, ${failed} failed`,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Enterprise batch appointment request failed`, {
        batchId,
        error: errorMessage,
        traceId,
        processingTimeMs: processingTime,
      });

      throw error;
    }
  }
}
