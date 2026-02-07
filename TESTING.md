# Wortex Testing Guide

This document describes the testing strategy and how to run tests for the Wortex application.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Continuous Integration](#continuous-integration)
- [Coverage Goals](#coverage-goals)

## Testing Overview

Wortex uses a comprehensive testing strategy with three layers:

1. **Unit Tests** - Test individual functions and utilities in isolation
2. **Integration Tests** - Test API routes and component integration
3. **End-to-End (E2E) Tests** - Test complete user journeys through the app

### Technologies

- **Jest** - Unit and integration test runner
- **React Testing Library** - Component testing utilities
- **Playwright** - E2E testing framework
- **TypeScript** - Type-safe test code

## Setup

### Prerequisites

All testing dependencies are installed automatically with:

```bash
npm install
```

### Environment Variables

For testing, the following environment variables are mocked in `jest.setup.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

For E2E tests, you'll need a `.env.test.local` file with real test credentials.

## Running Tests

### Unit & Integration Tests (Jest)

```bash
# Run all unit and integration tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:ci

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests headless
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

### Run All Tests

```bash
# Run all unit, integration, and E2E tests
npm run test:all
```

## Test Structure

```
Wortex/
├── __tests__/
│   ├── unit/                    # Unit tests for utilities and logic
│   │   ├── game.test.ts        # Core game logic tests
│   │   └── stars.test.ts       # Star rating calculation tests
│   ├── integration/             # Integration tests for API routes
│   │   └── auth.test.ts        # Authentication API tests
│   └── helpers/                 # Test utilities and helpers
│       └── test-utils.tsx      # Reusable test utilities
├── e2e/                         # End-to-end tests
│   ├── auth.spec.ts            # Authentication flow tests
│   ├── gameplay.spec.ts        # Game playing flow tests
│   └── fixtures/               # Test data fixtures
│       └── test-data.ts        # Sample test data
├── jest.config.ts              # Jest configuration
├── jest.setup.ts               # Jest test environment setup
└── playwright.config.ts        # Playwright configuration
```

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions in isolation.

**Example: Testing game logic**

```typescript
import { calculateScore } from '@/lib/utils/game';

describe('calculateScore', () => {
  test('should return perfect score (1.0) for minimal words', () => {
    const score = calculateScore(10, 10);
    expect(score).toBe(1.0);
  });

  test('should penalize seeing extra words', () => {
    const score = calculateScore(20, 10);
    expect(score).toBe(2.0);
  });
});
```

### Integration Tests

Integration tests verify API contracts and business logic.

**Example: Testing authentication**

```typescript
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Security', () => {
  test('should hash password securely', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });
});
```

### E2E Tests

E2E tests verify complete user workflows.

**Example: Testing sign up flow**

```typescript
import { test, expect } from '@playwright/test';

test('should sign up new user', async ({ page }) => {
  await page.goto('/signup');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/play/);
});
```

### Test Helpers

Use the provided test utilities in `__tests__/helpers/test-utils.tsx`:

```typescript
import { renderWithProviders, createMockPuzzle } from '@/__tests__/helpers/test-utils';

test('renders component with puzzle data', () => {
  const puzzle = createMockPuzzle();
  const { getByText } = renderWithProviders(<PuzzleDisplay puzzle={puzzle} />);

  expect(getByText(/to be or not to be/i)).toBeInTheDocument();
});
```

## Test Coverage

### Current Coverage

Run `npm run test:coverage` to see detailed coverage reports.

### Coverage Goals

Before addressing security vulnerabilities, we aim for:

- **Unit Tests**: 80%+ coverage of core game logic
- **Integration Tests**: 70%+ coverage of API routes
- **E2E Tests**: Coverage of all critical user journeys

### Critical Paths to Test

1. **Authentication**
   - Sign up flow
   - Sign in flow
   - Session persistence
   - Sign out

2. **Game Play**
   - Puzzle loading
   - Word dragging mechanics
   - Phase 1 completion
   - Phase 2 reordering
   - Bonus round
   - Score submission

3. **Leaderboards**
   - Daily leaderboard display
   - Pure vs Boosted tabs
   - Real-time updates

4. **Premium Features**
   - Archive access control
   - Stripe checkout flow
   - Subscription management

## Continuous Integration

### GitHub Actions (Recommended Setup)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:ci
      - run: npx playwright install
      - run: npm run test:e2e

      - uses: codecov/codecov-action@v3
        if: always()
```

## Debugging Tests

### Jest Tests

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file
npm test -- game.test.ts

# Update snapshots
npm test -- -u
```

### Playwright Tests

```bash
# Run with debug mode
npx playwright test --debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Generate test code
npx playwright codegen http://localhost:3000
```

## Best Practices

### DO:

- ✅ Write tests before fixing bugs (TDD for bug fixes)
- ✅ Test edge cases and error conditions
- ✅ Use descriptive test names that explain what is being tested
- ✅ Keep tests independent (no shared state between tests)
- ✅ Mock external dependencies (Supabase, Stripe, etc.)
- ✅ Test user behavior, not implementation details

### DON'T:

- ❌ Test library code (React, Next.js internals)
- ❌ Make tests depend on each other
- ❌ Use real API keys in tests
- ❌ Test styling details (use visual regression tools instead)
- ❌ Write tests that are flaky (random failures)

## Regression Testing Workflow

When fixing vulnerabilities or bugs:

1. **Run all tests first** to establish baseline:
   ```bash
   npm run test:all
   ```

2. **Make your fix**

3. **Run tests again** to ensure no regressions:
   ```bash
   npm run test:all
   ```

4. **Add new tests** for the bug you fixed

5. **Verify coverage** hasn't decreased:
   ```bash
   npm run test:coverage
   ```

## Troubleshooting

### Common Issues

**Jest tests fail with "Cannot find module"**
- Run `npm install` again
- Check that `moduleNameMapper` in `jest.config.ts` includes the path alias

**Playwright tests timeout**
- Increase timeout in test: `test.setTimeout(60000)`
- Check that dev server is running: `npm run dev`

**Tests pass locally but fail in CI**
- Check environment variables are set in CI
- Ensure Node version matches between local and CI

**React Testing Library queries not working**
- Import from `@testing-library/react`
- Use `screen.getByRole()` for better accessibility-focused queries

## Next Steps

After establishing this test foundation:

1. Run full test suite: `npm run test:all`
2. Review coverage report: `npm run test:coverage`
3. Begin fixing security vulnerabilities with confidence
4. Add regression tests for each fix

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
