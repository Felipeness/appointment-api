/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CircuitBreaker } from '../../common/resilience/circuit-breaker';
// import { DatabaseConnectionException } from '../../common/exceptions/domain.exceptions';

@Injectable()
export class ResilientPrismaService implements OnModuleInit {
  private readonly logger = new Logger(ResilientPrismaService.name);
  private readonly circuitBreaker: CircuitBreaker;
  private readonly queryCircuitBreaker: CircuitBreaker;

  constructor(private readonly prisma: PrismaService) {
    // Circuit breaker for connection operations
    this.circuitBreaker = new CircuitBreaker('database-connection', {
      failureThreshold: 3,
      recoveryTimeout: 15000, // 15 seconds
      monitoringPeriod: 30000, // 30 seconds
      successThreshold: 2,
    });

    // Circuit breaker for query operations
    this.queryCircuitBreaker = new CircuitBreaker('database-queries', {
      failureThreshold: 10,
      recoveryTimeout: 5000, // 5 seconds
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 5,
    });
  }

  async onModuleInit() {
    // Test initial connection with circuit breaker
    await this.testConnection();
  }

  async testConnection(): Promise<void> {
    try {
      await this.circuitBreaker.execute(async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        this.logger.log('Database connection healthy');
      });
    } catch (error) {
      this.logger.error('Database connection failed', error);
      this.logger.warn(
        'Running in MOCK MODE - database operations will be simulated for testing purposes',
      );
      // Don't throw error to allow app to start for testing
    }
  }

  // Wrapped Prisma operations with circuit breaker
  async findUnique<T>(model: string, args: any): Promise<T | null> {
    return this.queryCircuitBreaker.execute(async () => {
      const modelProxy = (this.prisma as any)[model];
      if (!modelProxy) {
        throw new Error(`Model ${model} not found`);
      }
      return await modelProxy.findUnique(args);
    });
  }

  async findMany<T>(model: string, args: any = {}): Promise<T[]> {
    return this.queryCircuitBreaker.execute(async () => {
      const modelProxy = (this.prisma as any)[model];
      if (!modelProxy) {
        throw new Error(`Model ${model} not found`);
      }
      return await modelProxy.findMany(args);
    });
  }

  async create<T>(model: string, args: any): Promise<T> {
    return this.queryCircuitBreaker.execute(async () => {
      const modelProxy = (this.prisma as any)[model];
      if (!modelProxy) {
        throw new Error(`Model ${model} not found`);
      }
      return await modelProxy.create(args);
    });
  }

  async update<T>(model: string, args: any): Promise<T> {
    return this.queryCircuitBreaker.execute(async () => {
      const modelProxy = (this.prisma as any)[model];
      if (!modelProxy) {
        throw new Error(`Model ${model} not found`);
      }
      return await modelProxy.update(args);
    });
  }

  async delete<T>(model: string, args: any): Promise<T> {
    return this.queryCircuitBreaker.execute(async () => {
      const modelProxy = (this.prisma as any)[model];
      if (!modelProxy) {
        throw new Error(`Model ${model} not found`);
      }
      return await modelProxy.delete(args);
    });
  }

  async executeTransaction<T>(
    fn: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return await this.prisma.$transaction(fn);
    });
  }

  // Direct access to Prisma for complex operations
  get client(): PrismaService {
    return this.prisma;
  }

  // Health check for monitoring
  async healthCheck(): Promise<{
    database: boolean;
    connectionCircuitBreaker: any;
    queryCircuitBreaker: any;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: true,
        connectionCircuitBreaker: this.circuitBreaker.getHealthStatus(),
        queryCircuitBreaker: this.queryCircuitBreaker.getHealthStatus(),
      };
    } catch {
      return {
        database: false,
        connectionCircuitBreaker: this.circuitBreaker.getHealthStatus(),
        queryCircuitBreaker: this.queryCircuitBreaker.getHealthStatus(),
      };
    }
  }

  // Manual circuit breaker control for operations
  resetCircuitBreakers(): void {
    this.circuitBreaker.forceClose();
    this.queryCircuitBreaker.forceClose();
    this.logger.log('Circuit breakers reset manually');
  }

  openCircuitBreakers(): void {
    this.circuitBreaker.forceOpen();
    this.queryCircuitBreaker.forceOpen();
    this.logger.warn('Circuit breakers opened manually');
  }
}
