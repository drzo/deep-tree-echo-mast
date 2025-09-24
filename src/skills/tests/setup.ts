/**
 * Jest Test Setup for Cognitive Skills
 * 
 * This file sets up the test environment for cognitive skills testing.
 */

// Extend Jest matchers if needed
import { expect } from '@jest/globals';

// Set longer timeout for cognitive processing tests
jest.setTimeout(30000);

// Mock console to reduce noise during tests (optional)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress non-error console output during tests unless VERBOSE_TESTS is set
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCognitiveResult(): R;
      toHaveValidConfidenceScore(): R;
    }
  }
}

// Custom Jest matchers for cognitive skills testing
expect.extend({
  toBeValidCognitiveResult(received: any) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => `Expected cognitive result to be an object, received ${typeof received}`,
        pass: false
      };
    }

    // Check for common cognitive result properties
    const hasValidStructure = received.hasOwnProperty('confidence') || 
                              received.hasOwnProperty('reasoning') ||
                              received.hasOwnProperty('qualityMetrics') ||
                              received.hasOwnProperty('learned');

    if (!hasValidStructure) {
      return {
        message: () => `Expected cognitive result to have valid structure (confidence, reasoning, qualityMetrics, or learned property)`,
        pass: false
      };
    }

    return {
      message: () => `Expected cognitive result to be invalid`,
      pass: true
    };
  },

  toHaveValidConfidenceScore(received: any) {
    const confidence = received?.confidence;
    
    if (typeof confidence !== 'number') {
      return {
        message: () => `Expected confidence to be a number, received ${typeof confidence}`,
        pass: false
      };
    }

    if (confidence < 0 || confidence > 1) {
      return {
        message: () => `Expected confidence to be between 0 and 1, received ${confidence}`,
        pass: false
      };
    }

    return {
      message: () => `Expected confidence score to be invalid`,
      pass: true
    };
  }
});

// Export test utilities
export const testHelpers = {
  createMockContext: () => ({
    mastra: {} as any,
    runtimeContext: {} as any,
    tracingContext: {} as any
  }),

  waitForAsync: (ms: number = 100) => 
    new Promise(resolve => setTimeout(resolve, ms)),

  generateTestCode: (complexity: 'low' | 'medium' | 'high' = 'low') => {
    const templates = {
      low: 'const hello = "world"; console.log(hello);',
      medium: `
        function fibonacci(n: number): number {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        console.log(fibonacci(10));
      `,
      high: `
        class ComplexDataProcessor {
          private data: any[] = [];
          private cache = new Map();
          
          async processData(input: any[]): Promise<any[]> {
            const results = [];
            for (let i = 0; i < input.length; i++) {
              try {
                const processed = await this.complexTransformation(input[i]);
                if (processed && this.validateResult(processed)) {
                  results.push(processed);
                  this.updateCache(input[i], processed);
                }
              } catch (error) {
                this.handleError(error, input[i]);
              }
            }
            return results;
          }
          
          private async complexTransformation(item: any): Promise<any> {
            // Complex nested processing
            return item;
          }
          
          private validateResult(result: any): boolean {
            return result !== null && result !== undefined;
          }
          
          private updateCache(key: any, value: any): void {
            this.cache.set(JSON.stringify(key), value);
          }
          
          private handleError(error: Error, context: any): void {
            console.error('Processing error:', error, context);
          }
        }
      `
    };
    
    return templates[complexity];
  }
};

console.log('🧪 Cognitive Skills test environment initialized');