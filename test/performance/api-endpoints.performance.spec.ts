/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { performance } from 'perf_hooks';
import { AppModule } from '../../src/app.module';
import { CreateAppointmentDto } from '../../src/application/dtos/create-appointment.dto';

describe('API Endpoints Performance Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const createValidAppointmentDto = (id: number = 1): CreateAppointmentDto => ({
    patientId: `patient-${id}`,
    psychologistId: `psychologist-${id}`,
    startDateTime: new Date('2024-12-25T10:00:00Z'),
    duration: 60,
    type: 'consultation',
  });

  describe('POST /appointments', () => {
    it('should respond within acceptable time (< 200ms)', async () => {
      const appointmentDto = createValidAppointmentDto();

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send(appointmentDto)
        .expect(202);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
      expect(response.body).toHaveProperty(
        'message',
        'Appointment request queued successfully',
      );
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const appointmentDto = createValidAppointmentDto();

      const startTime = performance.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app.getHttpServer())
          .post('/appointments')
          .send({
            ...appointmentDto,
            patientId: `patient-concurrent-${i}`,
          }),
      );

      const responses = await Promise.all(promises);

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / concurrentRequests;

      expect(totalDuration).toBeLessThan(2000);
      expect(avgDuration).toBeLessThan(200);
      responses.forEach((response) => {
        expect(response.status).toBe(202);
      });
    });

    it('should maintain performance under high load (50 requests)', async () => {
      const requestCount = 50;
      const appointmentDto = createValidAppointmentDto();

      const results: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            ...appointmentDto,
            patientId: `patient-load-${i}`,
          })
          .expect(202);

        const endTime = performance.now();
        results.push(endTime - startTime);
      }

      const avgResponseTime =
        results.reduce((sum, time) => sum + time, 0) / results.length;
      const maxResponseTime = Math.max(...results);
      const p95ResponseTime = results.sort((a, b) => a - b)[
        Math.floor(results.length * 0.95)
      ];

      expect(avgResponseTime).toBeLessThan(200);
      expect(maxResponseTime).toBeLessThan(500);
      expect(p95ResponseTime).toBeLessThan(300);
    });

    it('should handle validation errors quickly', async () => {
      const invalidDto = {
        patientId: '',
        psychologistId: '',
        startDateTime: 'invalid-date',
        duration: -1,
        type: 'invalid-type',
      };

      const startTime = performance.now();

      await request(app.getHttpServer())
        .post('/appointments')
        .send(invalidDto)
        .expect(400);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Validation should be very fast
      expect(duration).toBeLessThan(50);
    });
  });

  describe('POST /appointments/batch', () => {
    it('should handle batch requests efficiently', async () => {
      const batchSize = 5;
      const appointments = Array.from({ length: batchSize }, (_, i) =>
        createValidAppointmentDto(i),
      );

      const startTime = performance.now();

      const response = await request(app.getHttpServer())
        .post('/appointments/batch')
        .send({ appointments })
        .expect(202);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('batchId');
    });

    it('should scale linearly with batch size', async () => {
      const batchSizes = [1, 5, 10, 20];
      const results: { size: number; duration: number }[] = [];

      for (const size of batchSizes) {
        const appointments = Array.from({ length: size }, (_, i) =>
          createValidAppointmentDto(i),
        );

        const startTime = performance.now();

        await request(app.getHttpServer())
          .post('/appointments/batch')
          .send({ appointments })
          .expect(202);

        const endTime = performance.now();
        results.push({ size, duration: endTime - startTime });
      }

      // Check that duration scales roughly linearly
      const smallBatch = results.find((r) => r.size === 1);
      const largeBatch = results.find((r) => r.size === 20);

      const scalingRatio = largeBatch.duration / smallBatch.duration;

      // Should scale somewhat linearly but not excessively (max 30x slower for 20x data)
      expect(scalingRatio).toBeLessThan(30);
    });
  });

  describe('GET /health', () => {
    it('should respond very quickly (< 50ms)', async () => {
      const startTime = performance.now();

      await request(app.getHttpServer()).get('/health').expect(200);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should handle burst traffic on health endpoint', async () => {
      const requestCount = 100;
      const promises = Array.from({ length: requestCount }, () =>
        request(app.getHttpServer()).get('/health'),
      );

      const startTime = performance.now();
      const responses = await Promise.all(promises);
      const endTime = performance.now();

      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / requestCount;

      expect(totalDuration).toBeLessThan(2000);
      expect(avgDuration).toBeLessThan(20);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Memory Usage During API Calls', () => {
    it('should not cause memory leaks during API stress test', async () => {
      const initialMemory = process.memoryUsage();

      const requestCount = 100;
      const appointmentDto = createValidAppointmentDto();

      for (let i = 0; i < requestCount; i++) {
        await request(app.getHttpServer())
          .post('/appointments')
          .send({
            ...appointmentDto,
            patientId: `patient-memory-${i}`,
          });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (< 20MB for 100 requests)
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle server errors quickly', async () => {
      // Test with malformed JSON
      const startTime = performance.now();

      await request(app.getHttpServer())
        .post('/appointments')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(400);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 404 errors quickly', async () => {
      const startTime = performance.now();

      await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });
  });
});
