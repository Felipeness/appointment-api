import { HttpException, HttpStatus } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface ErrorResponseData {
  statusCode: number;
  message: string | string[];
  error: string;
  path?: string;
  method?: string;
  timestamp?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  const mockRequest = {
    url: '/test',
    method: 'GET',
    headers: {} satisfies Record<string, string>,
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockArgumentsHost = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => 'http' as const,
  } as ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('HTTP Exceptions', () => {
    it('should handle HttpException correctly', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const mockCall = jest.mocked(mockResponse.json).mock.calls[0];
      const responseData = mockCall?.[0] as ErrorResponseData;
      expect(responseData.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(responseData.message).toBe('Test error');
      expect(responseData.error).toBe('BAD_REQUEST');
      expect(responseData.path).toBe('/test');
      expect(responseData.method).toBe('GET');
      expect(typeof responseData.timestamp).toBe('string');
      expect(typeof responseData.correlationId).toBe('string');
    });

    it('should handle HttpException with object response', () => {
      const exceptionResponse = {
        message: ['field1 error', 'field2 error'],
        error: 'Validation Error',
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ['field1 error', 'field2 error'],
          error: 'Validation Error',
        }),
      );
    });
  });

  describe('Prisma Exceptions', () => {
    it('should handle P2002 (unique constraint) error', () => {
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalled();

      const mockCall = jest.mocked(mockResponse.json).mock.calls[0];
      const responseData = mockCall?.[0] as ErrorResponseData;
      expect(responseData.statusCode).toBe(HttpStatus.CONFLICT);
      expect(responseData.message).toBe(
        'A record with this information already exists',
      );
      expect(responseData.error).toBe('Duplicate Entry');
      expect((responseData.details as Record<string, unknown>).code).toBe(
        'P2002',
      );
    });

    it('should handle P2025 (record not found) error', () => {
      const exception = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
        meta: {},
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        }),
      );
    });
  });

  describe('Generic Exceptions', () => {
    it('should handle generic Error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const exception = new Error('Generic error message');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalled();

      const mockCall = jest.mocked(mockResponse.json).mock.calls[0];
      const responseData = mockCall?.[0] as ErrorResponseData;
      expect(responseData.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseData.message).toBe('Generic error message');
      expect(responseData.error).toBe('Internal Server Error');
      expect(
        typeof (responseData.details as Record<string, unknown>).stack,
      ).toBe('string');
      expect((responseData.details as Record<string, unknown>).name).toBe(
        'Error',
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic Error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const exception = new Error('Generic error message');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalled();

      const mockCall = jest.mocked(mockResponse.json).mock.calls[0];
      const responseData = mockCall?.[0] as ErrorResponseData;
      expect(responseData.message).toBe('Internal server error');
      expect(responseData.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Correlation ID', () => {
    it('should use correlation ID from request headers', () => {
      const correlationId = 'test-correlation-id';
      mockRequest.headers['x-correlation-id'] = correlationId;

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalled();

      const mockCall = jest.mocked(mockResponse.json).mock.calls[0];
      const responseData = mockCall?.[0] as ErrorResponseData;
      expect(responseData.correlationId).toBe(correlationId);
    });

    it('should generate correlation ID if not provided', () => {
      delete mockRequest.headers['x-correlation-id'];

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalled();

      const mockCall = jest.mocked(mockResponse.json).mock.calls[0];
      const responseData = mockCall?.[0] as ErrorResponseData;
      expect(typeof responseData.correlationId).toBe('string');
    });
  });
});
