/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseScheduleAppointmentUseCase } from '../enterprise-schedule-appointment.use-case';
import type { PsychologistRepository } from '../../../domain/repositories/psychologist.repository';
import { EnterpriseAppointmentProducer } from '../../../infrastructure/messaging/enterprise-appointment.producer';
import { CreateAppointmentDto } from '../../dtos/create-appointment.dto';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { addHours } from 'date-fns';

describe('EnterpriseScheduleAppointmentUseCase', () => {
  let useCase: EnterpriseScheduleAppointmentUseCase;
  let psychologistRepository: jest.Mocked<PsychologistRepository>;
  let enterpriseProducer: jest.Mocked<EnterpriseAppointmentProducer>;

  beforeEach(async () => {
    const mockPsychologistRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockEnterpriseProducer = {
      sendMessage: jest.fn(),
      sendBatchMessages: jest.fn(),
      receiveMessages: jest.fn(),
      deleteMessage: jest.fn(),
      getHealthStatus: jest.fn(),
      resetCircuitBreaker: jest.fn(),
      openCircuitBreaker: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseScheduleAppointmentUseCase,
        {
          provide: INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
          useValue: mockPsychologistRepository,
        },
        {
          provide: 'ENTERPRISE_MESSAGE_QUEUE',
          useValue: mockEnterpriseProducer,
        },
      ],
    }).compile();

    useCase = module.get<EnterpriseScheduleAppointmentUseCase>(
      EnterpriseScheduleAppointmentUseCase,
    );
    psychologistRepository = module.get(
      INJECTION_TOKENS.PSYCHOLOGIST_REPOSITORY,
    );
    enterpriseProducer = module.get('ENTERPRISE_MESSAGE_QUEUE');
  });

  const createValidDto = (): CreateAppointmentDto => {
    // Create a Monday at 10:00 AM, 25 hours from now
    const baseDate = addHours(new Date(), 25);
    const monday = new Date(baseDate);
    monday.setHours(10, 0, 0, 0);
    // Ensure it's a Monday (day 1)
    const dayDiff = 1 - monday.getDay();
    if (dayDiff !== 0) {
      monday.setDate(monday.getDate() + dayDiff + (dayDiff < 0 ? 7 : 0));
    }

    return {
      patientEmail: 'patient@test.com',
      patientName: 'John Doe',
      psychologistId: 'psychologist-id',
      scheduledAt: monday.toISOString(),
    };
  };

  describe('execute', () => {
    it('should queue appointment successfully with valid data', async () => {
      const dto = createValidDto();
      const mockPsychologist = { id: 'psychologist-id', isActive: true };

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      const result = await useCase.execute(dto);

      expect(result.status).toBe('queued');
      expect(result.appointmentId).toBeDefined();
      expect(result.traceId).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.estimatedProcessingTime).toBeDefined();

      expect(enterpriseProducer.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: result.appointmentId,
          patientEmail: dto.patientEmail,
          patientName: dto.patientName,
          psychologistId: dto.psychologistId,
          scheduledAt: dto.scheduledAt,
        }),
        expect.objectContaining({
          priority: expect.any(String),
          traceId: expect.any(String),
          messageGroupId: expect.any(String),
          deduplicationId: expect.any(String),
        }),
      );

      // Verify fast validation
      expect(psychologistRepository.findById).toHaveBeenCalledWith(
        dto.psychologistId,
      );
    });

    it('should return failed status when appointment is within 24 hours', async () => {
      const dto = createValidDto();
      dto.scheduledAt = addHours(new Date(), 12).toISOString(); // 12 hours from now

      const result = await useCase.execute(dto);

      expect(result.status).toBe('failed');
      expect(enterpriseProducer.sendMessage).not.toHaveBeenCalled();
    });

    it('should return failed status when psychologist not found', async () => {
      const dto = createValidDto();
      psychologistRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(dto);

      expect(result.status).toBe('failed');
      expect(enterpriseProducer.sendMessage).not.toHaveBeenCalled();
    });

    it('should return failed status when psychologist is inactive', async () => {
      const dto = createValidDto();
      const mockPsychologist = { id: 'psychologist-id', isActive: false };
      psychologistRepository.findById.mockResolvedValue(mockPsychologist);

      const result = await useCase.execute(dto);

      expect(result.status).toBe('failed');
      expect(enterpriseProducer.sendMessage).not.toHaveBeenCalled();
    });

    it('should use high priority for emergency appointments', async () => {
      const dto: CreateAppointmentDto = {
        ...createValidDto(),
        appointmentType: 'EMERGENCY',
      };
      const mockPsychologist = { id: 'psychologist-id', isActive: true };

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      const result = await useCase.execute(dto);

      expect(result.priority).toBe('high');
      expect(enterpriseProducer.sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          priority: 'high',
          delaySeconds: 0,
        }),
      );
    });

    it('should include optional fields in message when provided', async () => {
      const dto: CreateAppointmentDto = {
        ...createValidDto(),
        duration: 90,
        notes: 'Special requirements',
        consultationFee: 150.0,
      };
      const mockPsychologist = { id: 'psychologist-id', isActive: true };

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      await useCase.execute(dto);

      expect(enterpriseProducer.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 90,
          notes: 'Special requirements',
          consultationFee: 150.0,
        }),
        expect.anything(),
      );
    });

    it('should generate unique appointment IDs and trace IDs', async () => {
      const dto = createValidDto();
      const mockPsychologist = { id: 'psychologist-id', isActive: true };

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      const result1 = await useCase.execute(dto);
      const result2 = await useCase.execute(dto);

      expect(result1.appointmentId).not.toBe(result2.appointmentId);
      expect(result1.traceId).not.toBe(result2.traceId);
      expect(enterpriseProducer.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should support custom priority and trace ID options', async () => {
      const dto = createValidDto();
      const mockPsychologist = { id: 'psychologist-id', isActive: true };
      const customTraceId = 'custom-trace-123';

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      const result = await useCase.execute(dto, {
        priority: 'high',
        traceId: customTraceId,
        userId: 'user-123',
      });

      expect(result.priority).toBe('high');
      expect(result.traceId).toBe(customTraceId);
      expect(enterpriseProducer.sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          priority: 'high',
          traceId: customTraceId,
        }),
      );
    });
  });
});
