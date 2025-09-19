/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EnterpriseScheduleAppointmentUseCase } from '../enterprise-schedule-appointment.use-case';
import type { PsychologistRepository } from '../../../domain/repositories/psychologist.repository';
import type { EnterpriseAppointmentProducer } from '../../../infrastructure/messaging/enterprise-appointment.producer';
import { Psychologist } from '../../../domain/entities/psychologist.entity';
import { WorkingHours } from '../../../domain/value-objects/working-hours.vo';
import type { CreateAppointmentDto } from '../../dtos/create-appointment.dto';
import { INJECTION_TOKENS } from '../../../shared/constants/injection-tokens';
import { addHours } from 'date-fns';
import { AppointmentType } from '../../../domain/entities/enums';

function createMockPsychologist(): Psychologist {
  const workingHours = new WorkingHours({
    startTime: '09:00',
    endTime: '17:00',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  });

  return new Psychologist(
    'psychologist-id',
    'psychologist@test.com',
    'Dr. Test',
    workingHours,
    '+1234567890',
    'REG123',
    'Test biography',
    100,
    200,
    5,
    'https://example.com/profile.jpg',
    60,
    true,
    true,
    new Date(),
    new Date(),
    'admin',
    new Date(),
  );
}

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
      const mockPsychologist = createMockPsychologist();

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      const result = await useCase.execute(dto);

      expect(result.status).toBe('queued');
      expect(result.appointmentId).toBeDefined();
      expect(result.traceId).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.estimatedProcessingTime).toBeDefined();

      expect(enterpriseProducer).toHaveProperty('sendMessage');
      expect(enterpriseProducer.sendMessage).toHaveBeenCalled();

      const mockCall = jest.mocked(enterpriseProducer.sendMessage).mock
        .calls[0];
      const [messagePayload, messageOptions] = mockCall as [
        Record<string, unknown>,
        Record<string, unknown>,
      ];
      expect(messagePayload.appointmentId).toBe(result.appointmentId);
      expect(messagePayload.patientEmail).toBe(dto.patientEmail);
      expect(messagePayload.patientName).toBe(dto.patientName);
      expect(messagePayload.psychologistId).toBe(dto.psychologistId);
      expect(messagePayload.scheduledAt).toBe(dto.scheduledAt);

      expect(typeof messageOptions.priority).toBe('string');
      expect(typeof messageOptions.traceId).toBe('string');
      expect(typeof messageOptions.messageGroupId).toBe('string');
      expect(typeof messageOptions.deduplicationId).toBe('string');

      // Verify fast validation
      expect(psychologistRepository).toHaveProperty('findById');
      expect(jest.mocked(psychologistRepository.findById)).toHaveBeenCalledWith(
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
      const mockPsychologist = createMockPsychologist();
      const inactivePsychologist = new Psychologist(
        mockPsychologist.id,
        mockPsychologist.email,
        mockPsychologist.name,
        mockPsychologist.workingHours,
        mockPsychologist.phone,
        mockPsychologist.registrationId,
        mockPsychologist.biography,
        mockPsychologist.consultationFeeMin,
        mockPsychologist.consultationFeeMax,
        mockPsychologist.yearsExperience,
        mockPsychologist.profileImageUrl,
        mockPsychologist.timeSlotDuration,
        false, // isActive = false
        mockPsychologist.isVerified,
        mockPsychologist.createdAt,
        mockPsychologist.updatedAt,
        mockPsychologist.createdBy,
        mockPsychologist.lastLoginAt,
      );
      psychologistRepository.findById.mockResolvedValue(inactivePsychologist);

      const result = await useCase.execute(dto);

      expect(result.status).toBe('failed');
      expect(enterpriseProducer.sendMessage).not.toHaveBeenCalled();
    });

    it('should use high priority for emergency appointments', async () => {
      const dto: CreateAppointmentDto = {
        ...createValidDto(),
        appointmentType: AppointmentType.EMERGENCY,
      };
      const mockPsychologist = createMockPsychologist();

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      const result = await useCase.execute(dto);

      expect(result.priority).toBe('high');
      expect(enterpriseProducer).toHaveProperty('sendMessage');
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
      const mockPsychologist = createMockPsychologist();

      psychologistRepository.findById.mockResolvedValue(mockPsychologist);
      enterpriseProducer.sendMessage.mockResolvedValue();

      await useCase.execute(dto);

      expect(enterpriseProducer).toHaveProperty('sendMessage');
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
      const mockPsychologist = createMockPsychologist();

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
      const mockPsychologist = createMockPsychologist();
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
      expect(enterpriseProducer).toHaveProperty('sendMessage');
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
