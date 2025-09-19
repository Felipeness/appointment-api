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
var CircuitBreaker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitBreakerState = void 0;
const common_1 = require("@nestjs/common");
var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "CLOSED";
    CircuitBreakerState["OPEN"] = "OPEN";
    CircuitBreakerState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerState || (exports.CircuitBreakerState = CircuitBreakerState = {}));
let CircuitBreaker = CircuitBreaker_1 = class CircuitBreaker {
    name;
    logger = new common_1.Logger(CircuitBreaker_1.name);
    state = CircuitBreakerState.CLOSED;
    failureCount = 0;
    successCount = 0;
    totalRequests = 0;
    lastFailureTime;
    lastSuccessTime;
    nextAttemptTime;
    config = {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringPeriod: 60000,
        successThreshold: 3,
    };
    constructor(name, config) {
        this.name = name;
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }
    async execute(operation) {
        if (!this.canExecute()) {
            const error = new Error(`Circuit breaker ${this.name} is OPEN - failing fast`);
            this.logger.warn(`Circuit breaker ${this.name} blocked request`);
            throw error;
        }
        try {
            this.totalRequests++;
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    canExecute() {
        const now = new Date();
        switch (this.state) {
            case CircuitBreakerState.CLOSED:
                return true;
            case CircuitBreakerState.OPEN:
                if (this.nextAttemptTime && now >= this.nextAttemptTime) {
                    this.state = CircuitBreakerState.HALF_OPEN;
                    this.successCount = 0;
                    this.logger.log(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
                    return true;
                }
                return false;
            case CircuitBreakerState.HALF_OPEN:
                return true;
            default:
                return false;
        }
    }
    onSuccess() {
        this.lastSuccessTime = new Date();
        this.successCount++;
        if (this.state === CircuitBreakerState.HALF_OPEN) {
            if (this.successCount >= this.config.successThreshold) {
                this.close();
            }
        }
        else if (this.state === CircuitBreakerState.CLOSED) {
            this.resetFailureCount();
        }
    }
    onFailure() {
        this.lastFailureTime = new Date();
        this.failureCount++;
        if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.open();
        }
        else if (this.state === CircuitBreakerState.CLOSED) {
            if (this.failureCount >= this.config.failureThreshold) {
                this.open();
            }
        }
    }
    open() {
        this.state = CircuitBreakerState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
        this.logger.error(`Circuit breaker ${this.name} OPENED - failing fast for ${this.config.recoveryTimeout}ms`);
    }
    close() {
        this.state = CircuitBreakerState.CLOSED;
        this.resetFailureCount();
        this.successCount = 0;
        this.nextAttemptTime = undefined;
        this.logger.log(`Circuit breaker ${this.name} CLOSED - normal operation resumed`);
    }
    resetFailureCount() {
        const now = new Date();
        if (!this.lastFailureTime ||
            now.getTime() - this.lastFailureTime.getTime() >
                this.config.monitoringPeriod) {
            this.failureCount = 0;
        }
    }
    forceOpen() {
        this.state = CircuitBreakerState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
        this.logger.warn(`Circuit breaker ${this.name} manually OPENED`);
    }
    forceClose() {
        this.close();
        this.logger.warn(`Circuit breaker ${this.name} manually CLOSED`);
    }
    getMetrics() {
        return {
            totalRequests: this.totalRequests,
            successCount: this.successCount,
            failureCount: this.failureCount,
            state: this.state,
            lastFailureTime: this.lastFailureTime,
            lastSuccessTime: this.lastSuccessTime,
        };
    }
    getHealthStatus() {
        const failureRate = this.totalRequests > 0
            ? (this.failureCount / this.totalRequests) * 100
            : 0;
        return {
            isHealthy: this.state === CircuitBreakerState.CLOSED,
            state: this.state,
            failureRate,
            nextAttemptTime: this.nextAttemptTime,
        };
    }
};
exports.CircuitBreaker = CircuitBreaker;
exports.CircuitBreaker = CircuitBreaker = CircuitBreaker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String, Object])
], CircuitBreaker);
//# sourceMappingURL=circuit-breaker.js.map