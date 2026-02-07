/**
 * Testing utilities and helpers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <React.StrictMode>
        {children}
      </React.StrictMode>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  };
}

/**
 * Mock UserContext value
 */
export function createMockUserContext(overrides = {}) {
  return {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    displayName: 'Test User',
    email: 'test@example.com',
    isAnonymous: false,
    loading: false,
    tier: 'free' as const,
    tierLoading: false,
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock puzzle data for testing
 */
export function createMockPuzzle(overrides = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174001',
    date: '2024-01-01',
    targetPhrase: {
      id: 'target-1',
      text: 'To be or not to be',
      words: ['to', 'be', 'or', 'not', 'to', 'be'],
      type: 'target' as const,
    },
    facsimilePhrase: {
      id: 'facsimile-1',
      text: 'To exist or not to exist',
      words: ['to', 'exist', 'or', 'not', 'to', 'exist'],
      type: 'facsimile' as const,
    },
    speed: 1.0,
    bonusQuestion: {
      question: 'Who wrote this?',
      correctAnswer: 'Shakespeare',
      incorrectAnswers: ['Marlowe', 'Jonson', 'Bacon'],
    },
    theme: 'Classic literature',
    ...overrides,
  };
}

/**
 * Assert that an error was logged to console
 */
export function expectConsoleError(callback: () => void) {
  const originalError = console.error;
  const errors: any[] = [];

  console.error = (...args: any[]) => {
    errors.push(args);
  };

  callback();

  console.error = originalError;

  return {
    toHaveBeenCalledWith: (expectedError: string | RegExp) => {
      const found = errors.some((errorArgs) =>
        errorArgs.some((arg: any) => {
          if (typeof expectedError === 'string') {
            return String(arg).includes(expectedError);
          }
          return expectedError.test(String(arg));
        })
      );

      if (!found) {
        throw new Error(
          `Expected console.error to have been called with "${expectedError}", but it wasn't.\nActual errors: ${JSON.stringify(errors, null, 2)}`
        );
      }
    },
  };
}

/**
 * Mock fetch for API testing
 */
export function mockFetch(responses: Record<string, any>) {
  global.fetch = jest.fn((url: string) => {
    const response = responses[url];
    if (!response) {
      return Promise.reject(new Error(`No mock response for ${url}`));
    }

    return Promise.resolve({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    } as Response);
  });
}

/**
 * Restore original fetch
 */
export function restoreFetch() {
  if (global.fetch && (global.fetch as any).mockRestore) {
    (global.fetch as any).mockRestore();
  }
}
