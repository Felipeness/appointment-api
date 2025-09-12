import { Injectable, Logger } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms to wait before trying again
  monitoringPeriod: number; // Time window in ms for failure counting
  successThreshold: number; // Successes needed in HALF_OPEN to close
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  state: CircuitBreakerState;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;

  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5, // Open after 5 failures
    recoveryTimeout: 30000, // Wait 30 seconds before retry
    monitoringPeriod: 60000, // 1 minute window
    successThreshold: 3, // Need 3 successes to close
  };

  constructor(
    private readonly name: string,
    config?: Partial<CircuitBreakerConfig>,
  ) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit breaker should allow the request
    if (!this.canExecute()) {
      const error = new Error(
        `Circuit breaker ${this.name} is OPEN - failing fast`,
      );
      this.logger.warn(`Circuit breaker ${this.name} blocked request`);
      throw error;
    }

    try {
      this.totalRequests++;
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    const now = new Date();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.state = CircuitBreakerState.HALF_OPEN;
          this.successCount = 0; // Reset success count for HALF_OPEN
          this.logger.log(
            `Circuit breaker ${this.name} transitioning to HALF_OPEN`,
          );
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        return true;

      default:
        return false;
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.successCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in normal operation
      this.resetFailureCount();
    }
  }

  private onFailure(): void {
    this.lastFailureTime = new Date();
    this.failureCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in HALF_OPEN state goes back to OPEN
      this.open();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Check if we should open the circuit
      if (this.failureCount >= this.config.failureThreshold) {
        this.open();
      }
    }
  }

  private open(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
    this.logger.error(
      `Circuit breaker ${this.name} OPENED - failing fast for ${this.config.recoveryTimeout}ms`,
    );
  }

  private close(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.resetFailureCount();
    this.successCount = 0;
    this.nextAttemptTime = undefined;
    this.logger.log(
      `Circuit breaker ${this.name} CLOSED - normal operation resumed`,
    );
  }

  private resetFailureCount(): void {
    // Only reset failures that are older than monitoring period
    const now = new Date();
    if (
      !this.lastFailureTime ||
      now.getTime() - this.lastFailureTime.getTime() >
        this.config.monitoringPeriod
    ) {
      this.failureCount = 0;
    }
  }

  // Manual control methods
  forceOpen(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout);
    this.logger.warn(`Circuit breaker ${this.name} manually OPENED`);
  }

  forceClose(): void {
    this.close();
    this.logger.warn(`Circuit breaker ${this.name} manually CLOSED`);
  }

  // Metrics and monitoring
  getMetrics(): CircuitBreakerMetrics {
    return {
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      failureCount: this.failureCount,
      state: this.state,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  getHealthStatus(): {
    isHealthy: boolean;
    state: CircuitBreakerState;
    failureRate: number;
    nextAttemptTime?: Date;
  } {
    const failureRate =
      this.totalRequests > 0
        ? (this.failureCount / this.totalRequests) * 100
        : 0;

    return {
      isHealthy: this.state === CircuitBreakerState.CLOSED,
      state: this.state,
      failureRate,
      nextAttemptTime: this.nextAttemptTime,
    };
  }
}
