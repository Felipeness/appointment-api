// Global test setup for Jest
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test configuration
beforeAll(() => {
  // Set test timeout
  jest.setTimeout(30000);
});

// Global cleanup
afterAll(async () => {
  // Cleanup resources if needed
  await new Promise((resolve) => setTimeout(resolve, 100));
});

// Mock console methods in test environment
global.console = {
  ...console,
  // Uncomment to suppress console logs in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error, // Keep errors visible
};

// Global test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidUUID(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidDate(received: unknown) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${String(received)} not to be a valid Date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${String(received)} to be a valid Date`,
        pass: false,
      };
    }
  },

  toBeValidUUID(received: unknown) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${String(received)} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${String(received)} to be a valid UUID`,
        pass: false,
      };
    }
  },
});

// Setup test database if needed
export const setupTestDatabase = () => {
  // Database setup logic here
  console.log('Setting up test database...');
};

export const teardownTestDatabase = () => {
  // Database cleanup logic here
  console.log('Tearing down test database...');
};
