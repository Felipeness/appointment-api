import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
export declare class ResilientPrismaService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private readonly circuitBreaker;
    private readonly queryCircuitBreaker;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    testConnection(): Promise<void>;
    findUnique<T>(model: string, args: Record<string, unknown>): Promise<T | null>;
    findMany<T>(model: string, args?: Record<string, unknown>): Promise<T[]>;
    create<T>(model: string, args: Record<string, unknown>): Promise<T>;
    update<T>(model: string, args: Record<string, unknown>): Promise<T>;
    delete<T>(model: string, args: Record<string, unknown>): Promise<T>;
    executeTransaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T>;
    get client(): PrismaService;
    healthCheck(): Promise<{
        database: boolean;
        connectionCircuitBreaker: Record<string, unknown>;
        queryCircuitBreaker: Record<string, unknown>;
    }>;
    resetCircuitBreakers(): void;
    openCircuitBreakers(): void;
}
