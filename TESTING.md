# Testing Guide for Zheon

This document provides comprehensive guidelines for testing the Zheon YouTube summarization application.

## Table of Contents

- [Overview](#overview)
- [Testing Setup](#testing-setup)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Component Testing](#component-testing)
- [Server-Side Testing](#server-side-testing)
- [Testing Utilities](#testing-utilities)
- [Best Practices](#best-practices)
- [Running Tests](#running-tests)
- [Debugging Tests](#debugging-tests)

## Overview

Zheon uses a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Vitest for testing individual functions and utilities
- **Component Tests**: Testing Library + Vitest for Svelte component testing
- **E2E Tests**: Playwright for end-to-end browser testing
- **API Tests**: Vitest for server-side route and API testing

## Testing Setup

### Prerequisites

Ensure you have the following installed:
- Node.js 18+
- pnpm package manager
- All project dependencies

### Test Environment Configuration

The project uses separate configurations for different test types:

- **Client-side tests**: `vitest-setup-client.js` - Configures jsdom and Svelte Testing Library
- **Server-side tests**: Node environment for API and utility testing
- **E2E tests**: `playwright.config.js` - Configures browser testing

### Environment Variables

For testing, the following environment variables should be set:

```bash
# Test Supabase Configuration
PUBLIC_SUPABASE_URL=https://test.supabase.co
PUBLIC_SUPABASE_ANON_KEY=test-key

# Test API URLs
EXTRACT_API_URL=http://localhost:8000/extract
ANTHROPIC_API_KEY=test-key
```

## Unit Testing with Vitest

### Writing Unit Tests

Unit tests are located alongside their source files with `.test.js` extension:

```javascript
// src/lib/server/auth-utils.test.js
import { describe, it, expect } from 'vitest';
import { validateUser, isAuthenticated } from './auth-utils.js';

describe('auth-utils', () => {
  it('should validate authenticated user', () => {
    const user = { id: 'test-123' };
    expect(() => validateUser(user, new URL('http://localhost'))).not.toThrow();
  });
});
```

### Server-Side Testing

Test server utilities and API endpoints:

```javascript
// src/lib/server/validation-utils.test.js
import { validateYouTubeUrlFromForm } from './validation-utils.js';

describe('validation-utils', () => {
  it('should validate correct YouTube URL', () => {
    const formData = new FormData();
    formData.append('youtubeUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    expect(() => validateYouTubeUrlFromForm(formData)).not.toThrow();
  });
});
```

### Testing Async Functions

```javascript
import { getExistingSummary } from './summary-service.js';
import { createMockSupabase } from '$lib/test-utils.js';

it('should return existing summary', async () => {
  const mockSupabase = createMockSupabase();
  const result = await getExistingSummary('url', 'ko', 'user-id', mockSupabase);
  expect(result).toBeDefined();
});
```

## E2E Testing with Playwright

### Writing E2E Tests

E2E tests are located in the `e2e/` directory:

```javascript
// e2e/dashboard.test.js
import { expect, test } from '@playwright/test';

test('dashboard page loads correctly', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

### Authentication Testing

Use the provided authentication helpers:

```javascript
import { setupMockAuth, clearAuth } from './helpers/test-helpers.js';

test.beforeEach(async ({ page }) => {
  await setupMockAuth(page);
});

test('authenticated user can access dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.url()).toMatch(/dashboard/);
});
```

### Testing User Interactions

```javascript
test('form submission works correctly', async ({ page }) => {
  await page.goto('/dashboard');
  
  const urlInput = page.locator('input[name="youtubeUrl"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await submitButton.click();
  
  await expect(page.locator('body')).toContainText(/처리|loading/i);
});
```

## Component Testing

### Testing Svelte Components

Use Svelte Testing Library for component testing:

```javascript
// src/lib/components/Header.svelte.test.js
import { render, screen } from '@testing-library/svelte';
import Header from './Header.svelte';

it('should render header with logo', () => {
  render(Header, {
    props: {
      data: { user: mockUser, session: mockSession }
    }
  });
  
  expect(screen.getByText(/zheon/i)).toBeDefined();
});
```

### Testing Component Interactions

```javascript
import { fireEvent } from '@testing-library/svelte';

it('should handle button click', async () => {
  const { container } = render(Component);
  const button = screen.getByRole('button');
  
  await fireEvent.click(button);
  
  // Assert expected behavior
});
```

### Testing Props and Events

```javascript
it('should handle user authentication state', () => {
  const mockUser = createMockUser();
  
  render(Header, {
    props: {
      data: {
        user: mockUser,
        session: { access_token: 'test-token' }
      }
    }
  });
  
  // Test component behavior with authenticated user
});
```

## Server-Side Testing

### Testing SvelteKit Actions

```javascript
// src/routes/(main)/dashboard/+page.server.test.js
import { actions } from './+page.server.js';
import { createMockEvent, createMockFormData } from '$lib/test-utils.js';

it('should process form submission', async () => {
  const formData = createMockFormData({
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  });
  
  const event = createMockEvent({ formData });
  const result = await actions.default(event);
  
  expect(result.summary).toBeDefined();
});
```

### Mocking External Dependencies

```javascript
vi.mock('$lib/server/summary-claude.js', () => ({
  summarizeTranscript: vi.fn().mockResolvedValue({
    title: 'Test Title',
    summary: 'Test Summary',
    content: 'Test Content'
  })
}));
```

## Testing Utilities

### Available Test Utilities

The project provides comprehensive testing utilities in `src/lib/test-utils.js`:

#### Mock Creation Utilities

```javascript
import { 
  createMockSupabase,
  createMockUser,
  createMockSummary,
  createMockFormData,
  createMockUrl
} from '$lib/test-utils.js';

// Create mock Supabase client
const mockSupabase = createMockSupabase();

// Create mock user
const mockUser = createMockUser({
  email: 'test@example.com'
});

// Create mock form data
const formData = createMockFormData({
  youtubeUrl: 'https://www.youtube.com/watch?v=test'
});
```

#### Helper Functions

```javascript
import { waitFor, expectAsync, mockFetch } from '$lib/test-utils.js';

// Wait for async operations
await waitFor(100);

// Test async functions that might throw
const error = await expectAsync(async () => {
  throw new Error('Test error');
});
expect(error).toBeInstanceOf(Error);

// Mock fetch responses
mockFetch({ success: true }, { status: 200 });
```

### E2E Test Helpers

The project provides E2E helpers in `e2e/helpers/test-helpers.js`:

```javascript
import { 
  setupMockAuth,
  mockApiRoutes,
  waitForElement,
  fillForm,
  validateAccessibility
} from './helpers/test-helpers.js';

// Setup authentication
await setupMockAuth(page, mockUser);

// Mock API endpoints
await mockApiRoutes(page, {
  '**/api/summary/**': { status: 200, data: mockSummary }
});

// Test accessibility
const accessibilityResults = await validateAccessibility(page);
expect(accessibilityResults.hasProperHeadings).toBe(true);
```

## Best Practices

### General Testing Principles

1. **Write tests first** when implementing new features
2. **Test behavior, not implementation** details
3. **Use descriptive test names** that explain what is being tested
4. **Keep tests isolated** and independent
5. **Mock external dependencies** to ensure reliable tests

### Unit Testing Best Practices

1. **Test pure functions** thoroughly with various inputs
2. **Mock external APIs** and services
3. **Test error conditions** and edge cases
4. **Use parameterized tests** for testing multiple scenarios

```javascript
describe.each([
  ['valid-url', 'https://www.youtube.com/watch?v=test', true],
  ['invalid-url', 'not-a-url', false],
  ['empty-url', '', false]
])('%s', (name, input, shouldPass) => {
  it(`should ${shouldPass ? 'pass' : 'fail'} validation`, () => {
    if (shouldPass) {
      expect(() => validateUrl(input)).not.toThrow();
    } else {
      expect(() => validateUrl(input)).toThrow();
    }
  });
});
```

### Component Testing Best Practices

1. **Test component contracts** (props, events, slots)
2. **Test user interactions** rather than implementation details
3. **Use semantic queries** when possible (getByRole, getByLabelText)
4. **Test accessibility** features and keyboard navigation

```javascript
// Good: Testing behavior
expect(screen.getByRole('button', { name: /sign in/i })).toBeVisible();

// Avoid: Testing implementation
expect(container.querySelector('.sign-in-button')).toBeInTheDocument();
```

### E2E Testing Best Practices

1. **Test critical user journeys** end-to-end
2. **Use data-testid** for complex element selection
3. **Wait for elements** rather than using fixed timeouts
4. **Test responsive design** across different viewports
5. **Validate accessibility** in real browsers

```javascript
// Good: Wait for element
await expect(page.locator('[data-testid="summary-result"]')).toBeVisible();

// Avoid: Fixed timeout
await page.waitForTimeout(5000);
```

### Error Testing

1. **Test error boundaries** and error handling
2. **Simulate network failures** and API errors
3. **Test validation errors** and user feedback
4. **Test graceful degradation** when services are unavailable

```javascript
// Test error handling
await page.route('**/api/**', route => route.abort('failed'));
await page.goto('/dashboard');
// Verify error is handled gracefully
```

## Running Tests

### Available Test Scripts

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run unit tests in watch mode
pnpm test:unit -- --watch

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test:unit -- --coverage

# Run specific test file
pnpm test:unit auth-utils.test.js

# Run tests matching pattern
pnpm test:unit -- --testNamePattern="validation"
```

### Test Configuration

#### Vitest Configuration

Tests are configured in `vite.config.js`:

```javascript
export default defineConfig({
  test: {
    workspace: [
      // Client-side tests
      {
        extends: './vite.config.js',
        plugins: [svelteTesting()],
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          setupFiles: ['./vitest-setup-client.js']
        }
      },
      // Server-side tests
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
        }
      }
    ]
  }
});
```

#### Playwright Configuration

E2E tests are configured in `playwright.config.js`:

```javascript
export default defineConfig({
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173
  },
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4173'
  }
});
```

## Debugging Tests

### Debugging Unit Tests

1. **Use console.log** for simple debugging
2. **Use debugger statements** and run with `--inspect`
3. **Check mock call history** with `vi.mock.calls`

```javascript
// Debug mock calls
console.log(mockFunction.mock.calls);

// Use debugger
debugger;
expect(result).toBe(expected);
```

### Debugging E2E Tests

1. **Use headed mode** to see browser interactions
2. **Take screenshots** on failures
3. **Use page.pause()** to stop execution
4. **Enable debug logs** for detailed information

```bash
# Run in headed mode
pnpm test:e2e --headed

# Run with debug
DEBUG=pw:api pnpm test:e2e

# Run single test with debugging
pnpm test:e2e --debug dashboard.test.js
```

### Common Debugging Techniques

```javascript
// Take screenshot for debugging
await page.screenshot({ path: 'debug.png', fullPage: true });

// Pause execution
await page.pause();

// Log page content
console.log(await page.content());

// Check console errors
page.on('console', msg => console.log('Browser log:', msg.text()));
```

## Continuous Integration

### GitHub Actions Integration

The project can integrate with GitHub Actions for automated testing:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:e2e
```

### Coverage Reporting

Generate and track test coverage:

```bash
# Generate coverage report
pnpm test:unit -- --coverage

# View coverage in browser
open coverage/index.html
```

## Troubleshooting

### Common Issues

1. **jsdom limitations**: Some browser APIs aren't available in unit tests
2. **Timing issues**: Use proper waiting mechanisms in E2E tests
3. **Mock conflicts**: Ensure mocks are properly cleared between tests
4. **Environment differences**: Test in similar environment to production

### Performance Tips

1. **Use test.concurrent** for independent parallel tests
2. **Reuse browser contexts** in Playwright when possible
3. **Mock heavy operations** in unit tests
4. **Use test.only** during development to focus on specific tests

This testing guide provides comprehensive coverage for testing all aspects of the Zheon application. Follow these guidelines to maintain high code quality and reliable functionality.