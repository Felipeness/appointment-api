"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ResilientPrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilientPrismaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const circuit_breaker_1 = require("../../common/resilience/circuit-breaker");
let ResilientPrismaService = ResilientPrismaService_1 = class ResilientPrismaService {
    prisma;
    logger = new common_1.Logger(ResilientPrismaService_1.name);
    circuitBreaker;
    queryCircuitBreaker;
    constructor(prisma) {
        this.prisma = prisma;
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker('database-connection', {
            failureThreshold: 3,
            recoveryTimeout: 15000,
            monitoringPeriod: 30000,
            successThreshold: 2,
        });
        this.queryCircuitBreaker = new circuit_breaker_1.CircuitBreaker('database-queries', {
            failureThreshold: 10,
            recoveryTimeout: 5000,
            monitoringPeriod: 60000,
            successThreshold: 5,
        });
    }
    async onModuleInit() {
        await this.testConnection();
    }
    async testConnection() {
        try {
            await this.circuitBreaker.execute(async () => {
                await this.prisma.$queryRaw `SELECT 1`;
                this.logger.log('Database connection healthy');
            });
        }
        catch (error) {
            this.logger.error('Database connection failed', error);
            this.logger.warn('Running in MOCK MODE - database operations will be simulated for testing purposes');
        }
    }
    async findUnique(model, args) {
        return this.queryCircuitBreaker.execute(async () => {
            const modelProxy = this.prisma[model];
            if (!modelProxy) {
                throw new Error(`Model ${model} not found`);
            }
            return await modelProxy.findUnique(args);
        });
    }
    async findMany(model, args = {}) {
        return this.queryCircuitBreaker.execute(async () => {
            const modelProxy = this.prisma[model];
            if (!modelProxy) {
                throw new Error(`Model ${model} not found`);
            }
            return await modelProxy.findMany(args);
        });
    }
    async create(model, args) {
        return this.queryCircuitBreaker.execute(async () => {
            const modelProxy = this.prisma[model];
            if (!modelProxy) {
                throw new Error(`Model ${model} not found`);
            }
            return await modelProxy.create(args);
        });
    }
    async update(model, args) {
        return this.queryCircuitBreaker.execute(async () => {
            const modelProxy = this.prisma[model];
            if (!modelProxy) {
                throw new Error(`Model ${model} not found`);
            }
            return await modelProxy.update(args);
        });
    }
    async delete(model, args) {
        return this.queryCircuitBreaker.execute(async () => {
            const modelProxy = this.prisma[model];
            if (!modelProxy) {
                throw new Error(`Model ${model} not found`);
            }
            return await modelProxy.delete(args);
        });
    }
    async executeTransaction(fn) {
        return this.circuitBreaker.execute(async () => {
            return await this.prisma.$transaction(fn);
        });
    }
    get client() {
        return this.prisma;
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                database: true,
                connectionCircuitBreaker: this.circuitBreaker.getHealthStatus(),
                queryCircuitBreaker: this.queryCircuitBreaker.getHealthStatus(),
            };
        }
        catch {
            return {
                database: false,
                connectionCircuitBreaker: this.circuitBreaker.getHealthStatus(),
                queryCircuitBreaker: this.queryCircuitBreaker.getHealthStatus(),
            };
        }
    }
    resetCircuitBreakers() {
        this.circuitBreaker.forceClose();
        this.queryCircuitBreaker.forceClose();
        this.logger.log('Circuit breakers reset manually');
    }
    openCircuitBreakers() {
        this.circuitBreaker.forceOpen();
        this.queryCircuitBreaker.forceOpen();
        this.logger.warn('Circuit breakers opened manually');
    }
};
exports.ResilientPrismaService = ResilientPrismaService;
exports.ResilientPrismaService = ResilientPrismaService = ResilientPrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResilientPrismaService);
//# sourceMappingURL=resilient-prisma.service.js.map