# Testing Guide - BeMoreFrontend

Complete testing documentation for the BeMoreFrontend project covering unit tests, component tests, E2E tests, and testing best practices.

**Last Updated**: Q4 2024
**Test Framework Versions**: Vitest 1.0+, React Testing Library, Playwright 1.40+

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Architecture](#testing-architecture)
3. [Unit Testing (Vitest)](#unit-testing-vitest)
4. [Component Testing (RTL)](#component-testing-rtl)
5. [E2E Testing (Playwright)](#e2e-testing-playwright)
6. [Test Organization](#test-organization)
7. [Writing Tests](#writing-tests)
8. [Best Practices](#best-practices)
9. [Debugging Tests](#debugging-tests)
10. [CI/CD Integration](#cicd-integration)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Run All Tests
```bash
# Run all test suites
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode (interactive)
npm run test:watch

# Run specific test file
npm run test -- src/utils/__tests__/imageOptimization.test.ts
```

### View Test Dashboard
```bash
# Display formatted test metrics dashboard
node scripts/test-dashboard.js
```

### Run E2E Tests
```bash
# Run Playwright E2E tests
npm run e2e

# Run E2E tests in UI mode (interactive browser)
npm run e2e:ui

# Run specific E2E test
npm run e2e -- e2e/navigation.spec.ts
```

### Generate Coverage Report
```bash
# Generate coverage report (HTML + Terminal)
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

---

## Testing Architecture

### Tier 1: Unit Tests (Vitest)
**Focus**: Pure functions, utilities, individual logic units
**Scope**: Single files, no dependencies
**Speed**: Fastest (~500ms for full suite)
**Examples**: Image optimization, font handling, performance metrics

```
src/utils/__tests__/
├── imageOptimization.test.ts    (48 tests)
├── fontOptimization.test.ts     (42 tests)
├── webVitals.test.ts            (26 tests)
└── performanceReporting.test.ts (48 tests)
```

### Tier 2: Component Tests (RTL)
**Focus**: React components, hooks, user interactions
**Scope**: Component rendering and behavior
**Speed**: Fast (~1s for full suite)
**Examples**: Progress components, Settings context, OptimizedImage

```
src/components/__tests__/
├── OptimizedImage.test.tsx       (30+ tests)
├── ui/__tests__/Progress.test.tsx (35+ tests)
└── contexts/__tests__/SettingsContext.test.tsx (25 tests)
```

### Tier 3: E2E Tests (Playwright)
**Focus**: Full user workflows, cross-browser, production-like
**Scope**: Complete application, all layers
**Speed**: Slower (~2-5s per test)
**Examples**: Navigation, performance, accessibility

```
e2e/
├── navigation.spec.ts     (4 tests)
├── performance.spec.ts    (6 tests)
└── accessibility.spec.ts  (10 tests)
```

### Test Pyramid

```
        E2E Tests (20 tests)
           [Slow, Expensive]
              ~5 seconds

     Component Tests (90+ tests)
        [Medium Speed]
         ~1-2 seconds

    Unit Tests (259 tests)
      [Fast, Cheap]
     ~0.5 seconds

Total: 369 tests | Coverage: 75%+ across all categories
```

---

## Unit Testing (Vitest)

### Setup

**Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Setup File** (`vitest.setup.ts`):
Mocks browser APIs (ResizeObserver, IntersectionObserver, localStorage) for JSDOM environment.

### Test File Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from '../functionToTest';

describe('Module Name', () => {

  describe('Function Group', () => {

    it('should describe expected behavior', () => {
      // Arrange
      const input = 'test value';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(functionToTest(null)).toThrow();
    });
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch

# Run specific file
npm run test -- src/utils/__tests__/imageOptimization.test.ts

# Run tests matching pattern
npm run test -- --grep "detectImageFormats"

# Run single test
npm run test -- --grep "should detect WebP support"
```

### Coverage Thresholds

Current targets (defined in `vitest.config.ts`):
```yaml
Statements: 80%+   (Current: 72%)
Branches:   75%+   (Current: 70%)
Functions:  80%+   (Current: 78%)
Lines:      75%+   (Current: 75%)
```

### Key Test Files

#### imageOptimization.test.ts
Tests image format detection, responsive srcset generation, and lazy loading:
```typescript
// 48 tests covering:
- detectImageFormats() → WebP/AVIF support detection
- generateSrcset() → Responsive image URLs with width descriptors
- generateResponsiveSrcsets() → Multiple format srcsets
- ImageLoadingMetrics → Load tracking and statistics
- lazyLoadImage() → Lazy loading setup
- handleImageError() → Fallback image handling
```

#### fontOptimization.test.ts
Tests font stack definitions and font loading:
```typescript
// 42 tests covering:
- System font stacks (UI, body, mono, serif)
- Font CSS variables and sizes
- FontLoadingTracker → load state and timing
- waitForFontLoad() → Single font async loading
- waitForFontsLoad() → Multiple fonts loading
```

#### webVitals.test.ts
Tests Web Vitals metric collection:
```typescript
// 26 tests covering:
- Metric rating system (good/needs-improvement/poor)
- Core Web Vitals (LCP, FID, CLS, TTFB, FCP, INP)
- Navigation type detection
- Entry collection and processing
```

#### performanceReporting.test.ts
Tests performance metrics management:
```typescript
// 48 tests covering:
- PerformanceReportingManager initialization
- Metrics recording and storage
- Threshold checking and alerts
- Report generation and export
- Summary statistics and trends
```

---

## Component Testing (RTL)

### Setup

**React Testing Library** provides utilities for testing React components without implementation details:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Test Structure

```typescript
// 1. Render component
render(<Component prop="value" />);

// 2. Query elements (by role, label, text - in order of preference)
const button = screen.getByRole('button', { name: /click me/i });
const input = screen.getByLabelText('Email');
const text = screen.getByText('Expected');

// 3. Interact with component
await userEvent.click(button);
await userEvent.type(input, 'test@example.com');

// 4. Assert expectations
expect(button).toBeInTheDocument();
expect(button).toBeDisabled();
expect(button).toHaveClass('active');
```

### Running Component Tests

```bash
# Run all component tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific component test
npm run test -- src/components/__tests__/OptimizedImage.test.tsx
```

### Key Test Files

#### OptimizedImage.test.tsx
Tests image component rendering and interactions:
```typescript
// 30+ tests covering:
- Picture element rendering with sources
- Alt text and accessibility
- Loading states and transitions
- Error handling
- Responsive sizing
- Dark mode support
- Click handlers
```

#### Progress.test.tsx
Tests progress indicator components:
```typescript
// 35+ tests covering:
- ProgressBar rendering and sizing
- CircularProgress SVG rendering
- ProgressRing animated spinner
- ARIA attributes (aria-valuenow, aria-valuemin, etc.)
- Color variants (primary, success, warning, danger)
- Size variants (sm, md, lg)
- Animation states
```

#### SettingsContext.test.tsx
Tests application settings management:
```typescript
// 25 tests covering:
- Default settings provision
- localStorage persistence
- Setting updates (fontScale, language, density)
- HTML attribute synchronization
- Hook usage and error handling
```

### Best Practices for Component Tests

1. **Query Priority** (use in order):
   - `getByRole()` - Most accessible
   - `getByLabelText()` - For form inputs
   - `getByPlaceholderText()` - For inputs without labels
   - `getByText()` - For text content
   - `getByTestId()` - Last resort

2. **Avoid Implementation Details**:
   ```typescript
   // ❌ Bad - Testing internals
   expect(component.state.value).toBe('test');

   // ✅ Good - Testing behavior
   expect(screen.getByRole('textbox')).toHaveValue('test');
   ```

3. **Use userEvent over fireEvent**:
   ```typescript
   // ❌ Outdated
   fireEvent.click(button);

   // ✅ Current
   await userEvent.click(button);
   ```

4. **Test User Workflows**:
   ```typescript
   // Test complete user interaction
   const input = screen.getByLabelText('Email');
   await userEvent.type(input, 'test@example.com');
   await userEvent.click(screen.getByRole('button', { name: /submit/i }));
   expect(screen.getByText('Success')).toBeInTheDocument();
   ```

---

## E2E Testing (Playwright)

### Setup

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### Test File Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {

  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should complete user workflow', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Click Me")');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode (interactive browser)
npm run e2e:ui

# Run in headed mode (visible browser)
npm run e2e -- --headed

# Run specific test
npm run e2e -- e2e/navigation.spec.ts

# Run on specific browser
npm run e2e -- --project=firefox

# Debug with inspector
npm run e2e -- --debug

# Update snapshots
npm run e2e -- --update-snapshots
```

### Key Test Files

#### navigation.spec.ts
Tests basic page navigation and structure:
```typescript
// 4 tests:
- Home page loads successfully
- Main content is visible
- No console errors during load
- Document lang attribute is set
```

#### performance.spec.ts
Tests performance metrics and optimization:
```typescript
// 6 tests:
- Page load time < 5 seconds
- Performance metrics collection
- Layout shift detection
- Resource optimization
- Caching behavior
```

#### accessibility.spec.ts
Tests WCAG compliance and accessibility:
```typescript
// 10 tests:
- Proper heading structure
- Lang attribute on html element
- Alt text for images
- Keyboard navigation support
- Focus visible indicators
- Color contrast validation
- ARIA attributes presence
- Form control accessibility
```

### Playwright Best Practices

1. **Use Proper Locators**:
   ```typescript
   // ❌ Brittle
   page.locator('div.btn:nth-child(2)');

   // ✅ Robust
   page.locator('button:has-text("Submit")');
   page.getByRole('button', { name: 'Submit' });
   ```

2. **Wait for Elements**:
   ```typescript
   // Automatic waiting (10 seconds)
   await page.locator('text=Loaded').click();

   // Explicit waiting
   await page.waitForLoadState('networkidle');
   ```

3. **Handle Async Operations**:
   ```typescript
   // Wait for specific condition
   await expect(page.locator('.success')).toBeVisible();

   // Wait for navigation
   await Promise.all([
     page.waitForNavigation(),
     page.click('a:has-text("Next")')
   ]);
   ```

4. **Capture Evidence**:
   ```typescript
   // Screenshots on failure (automatic)
   // Videos on failure (configured)
   // DOM snapshots
   await page.pause(); // Debug breakpoint
   ```

---

## Test Organization

### Directory Structure

```
BeMoreFrontend/
├── src/
│   ├── utils/__tests__/
│   │   ├── imageOptimization.test.ts      (Tier 1)
│   │   ├── fontOptimization.test.ts       (Tier 1)
│   │   ├── webVitals.test.ts              (Tier 1)
│   │   └── performanceReporting.test.ts   (Tier 1)
│   │
│   ├── components/__tests__/
│   │   ├── OptimizedImage.test.tsx        (Tier 2)
│   │   └── ui/__tests__/
│   │       └── Progress.test.tsx          (Tier 2)
│   │
│   └── contexts/__tests__/
│       └── SettingsContext.test.tsx       (Tier 2)
│
├── e2e/
│   ├── navigation.spec.ts                 (Tier 3)
│   ├── performance.spec.ts                (Tier 3)
│   └── accessibility.spec.ts              (Tier 3)
│
├── scripts/
│   └── test-dashboard.js                  (Monitoring)
│
├── coverage/                              (Generated)
│   ├── index.html
│   ├── lcov.info
│   └── ...
│
├── vitest.config.ts
├── vitest.setup.ts
├── playwright.config.ts
└── TESTING.md                             (This file)
```

### Naming Conventions

**Test Files**:
```
[source-file].test.ts          # Unit tests
[Component].test.tsx           # Component tests
[feature].spec.ts              # E2E tests
```

**Test Names**:
```typescript
// Descriptive, user-centric language
it('should render progress bar with correct percentage', () => {});
it('should persist user settings to localStorage', () => {});
it('should navigate to dashboard when user clicks menu', () => {});

// Pattern: "should [behavior] when [condition]"
it('should show error message when API fails', () => {});
it('should enable submit button when form is valid', () => {});
```

---

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionUnderTest } from '../functionUnderTest';

describe('FunctionUnderTest', () => {
  let sampleData: any;

  beforeEach(() => {
    // Setup for each test
    sampleData = { id: 1, name: 'Test' };
  });

  describe('Normal Cases', () => {
    it('should return expected value with valid input', () => {
      const result = functionUnderTest(sampleData);
      expect(result).toBe(expectedValue);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      expect(() => functionUnderTest(null)).toThrow();
    });

    it('should handle empty arrays', () => {
      const result = functionUnderTest([]);
      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should throw with invalid parameters', () => {
      expect(() => functionUnderTest('invalid')).toThrow();
    });
  });
});
```

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render with default props', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole('button', { name: /click/i });
    await user.click(button);

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<MyComponent className="custom" />);
    expect(container.querySelector('.custom')).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete sign-up flow', async ({ page }) => {
    // Navigate to signup
    await page.click('text=Sign Up');

    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123');

    // Submit
    await page.click('button:has-text("Create Account")');

    // Verify success
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

---

## Best Practices

### 1. Test Naming

✅ **Good**: Describes behavior and context
```typescript
it('should display loading spinner while fetching data', () => {});
it('should highlight required fields in red when empty', () => {});
it('should disable submit button when form has validation errors', () => {});
```

❌ **Bad**: Vague or technical
```typescript
it('tests the component', () => {});
it('unit test for API call', () => {});
it('test 1', () => {});
```

### 2. Test Size (AAA Pattern)

Keep tests small and focused - one assertion per test when possible:

```typescript
// ✅ Good - Single responsibility
describe('calculateTotal', () => {
  it('should add all item prices', () => {
    const result = calculateTotal([10, 20, 30]);
    expect(result).toBe(60);
  });

  it('should return 0 for empty array', () => {
    const result = calculateTotal([]);
    expect(result).toBe(0);
  });
});

// ❌ Bad - Multiple concerns in one test
it('should calculate and format total', () => {
  const result = calculateTotal([10, 20, 30]);
  expect(result).toBe(60);
  expect(result.toLocaleString()).toBe('60');
  expect(formatCurrency(result)).toBe('$60.00');
});
```

### 3. Avoid Test Interdependencies

```typescript
// ❌ Bad - Tests depend on execution order
describe('User', () => {
  let userId;

  it('should create user', () => {
    userId = createUser('John');
  });

  it('should fetch user by id', () => {
    const user = getUser(userId); // Depends on previous test
  });
});

// ✅ Good - Each test is independent
describe('User', () => {
  it('should create user', () => {
    const userId = createUser('John');
    expect(userId).toBeDefined();
  });

  it('should fetch user by id', () => {
    const userId = createUser('Jane');
    const user = getUser(userId);
    expect(user.name).toBe('Jane');
  });
});
```

### 4. Mock External Dependencies

```typescript
import { vi } from 'vitest';

// ✅ Good - Isolated unit test
it('should call API with correct parameters', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true });
  global.fetch = mockFetch;

  await fetchUserData('123');

  expect(mockFetch).toHaveBeenCalledWith('/api/users/123');
});
```

### 5. Use Meaningful Assertions

```typescript
// ❌ Generic assertions
expect(result).toBe(true);

// ✅ Specific, readable assertions
expect(user).toHaveProperty('email', 'test@example.com');
expect(button).toBeDisabled();
expect(screen.getByText('Error')).toBeInTheDocument();
expect(list).toHaveLength(3);
```

### 6. Keep Tests Maintainable

```typescript
// ✅ Good - Reusable test utilities
const renderComponent = (props) => render(<MyComponent {...props} />);
const fillForm = (email, password) => {
  userEvent.type(screen.getByLabelText('Email'), email);
  userEvent.type(screen.getByLabelText('Password'), password);
};

it('should login successfully', async () => {
  renderComponent();
  await fillForm('test@example.com', 'password');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
});
```

---

## Debugging Tests

### 1. Debug Mode

```bash
# Run with Vitest inspector
npm run test -- --inspect-brk

# Run Playwright with inspector
npm run e2e -- --debug
```

### 2. Console Logging

```typescript
it('should debug complex logic', () => {
  const result = complexFunction(input);
  console.log('Input:', input);
  console.log('Result:', result);
  console.log('Expected:', expected);
  expect(result).toBe(expected);
});
```

### 3. Playwright Debug

```typescript
test('should debug with pause', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Debugger opens, inspect page
  await page.click('button');
});

// Or use inspector
test('should debug complex flow', async ({ page }) => {
  await page.goto('/');
  // Playwright Inspector opens automatically with --debug
});
```

### 4. RTL Debug Utilities

```typescript
import { render, screen } from '@testing-library/react';

it('should debug component structure', () => {
  const { debug } = render(<MyComponent />);

  // Print entire DOM
  debug();

  // Print specific element
  debug(screen.getByRole('button'));
});
```

### 5. Coverage Analysis

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# Check specific file coverage
npm run test:coverage -- src/utils/imageOptimization.ts
```

### 6. Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot find module" | Import path incorrect | Check file path and aliases |
| "ReferenceError: React is not defined" | Missing React import | Add `import React from 'react'` |
| "Element not found" | Timing issue | Use `waitFor()` or `findBy` |
| "Test timeout" | Long-running operation | Increase timeout or optimize |
| "localStorage is undefined" | Running in JSDOM | Check vitest.setup.ts mocks |
| "Stale closure" | State update delayed | Use `waitFor()` for assertions |

---

## CI/CD Integration

### GitHub Actions Workflows

**test.yml** - Runs on every push and PR:
```yaml
name: Tests
on:
  push: [main, develop]
  pull_request: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npx playwright install
      - run: npm run e2e
      - uses: codecov/codecov-action@v3
```

**performance.yml** - Monitors build size and performance:
```yaml
name: Performance
on: [push, pull_request]
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run analyze-bundle
```

### Local CI Simulation

```bash
# Run complete CI pipeline locally
npm run typecheck && npm run lint && npm run test && npm run build && npm run e2e
```

---

## Troubleshooting

### Unit Test Issues

**Problem**: Tests fail with "Cannot find module"
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules
npm install
npm run test
```

**Problem**: JSDOM doesn't support browser API
```typescript
// Solution: Mock in vitest.setup.ts or test
vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
```

**Problem**: Async code not completing
```typescript
// Solution: Use proper async/await
it('should load data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Component Test Issues

**Problem**: "Unable to find element"
```typescript
// Solution: Check if element exists and wait if needed
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

**Problem**: Context not provided
```typescript
// Solution: Wrap component in required providers
render(
  <SettingsProvider>
    <MyComponent />
  </SettingsProvider>
);
```

**Problem**: Props not updating
```typescript
// Solution: Use rerender for prop updates
const { rerender } = render(<MyComponent prop="initial" />);
rerender(<MyComponent prop="updated" />);
expect(screen.getByText('updated')).toBeInTheDocument();
```

### E2E Test Issues

**Problem**: Tests time out
```bash
# Solution: Increase timeout or check app availability
npm run dev  # Ensure dev server running
npm run e2e -- --timeout=60000
```

**Problem**: Flaky tests (intermittent failures)
```typescript
// Solution: Add explicit waits
await page.waitForLoadState('networkidle');
await expect(page.locator('.loaded')).toBeVisible({ timeout: 10000 });
```

**Problem**: Cross-browser failures
```bash
# Solution: Test on specific browser
npm run e2e -- --project=firefox
npm run e2e -- --project=webkit
```

### Coverage Issues

**Problem**: Coverage not generating
```bash
# Solution: Check configuration and try again
npm run test:coverage -- --reporter=html
open coverage/index.html
```

**Problem**: Coverage below target
```bash
# Solution: Add missing test cases
# Find uncovered lines: coverage/index.html
# Write tests for those code paths
```

---

## Testing Checklist

Before committing code:

- [ ] Unit tests written for new utilities
- [ ] Component tests written for new components
- [ ] E2E tests added for new user workflows
- [ ] All tests passing locally (`npm run test`)
- [ ] No console errors or warnings
- [ ] Coverage maintained above targets
- [ ] Code reviewed for testability
- [ ] Edge cases considered and tested
- [ ] Error scenarios covered
- [ ] Accessibility requirements tested

---

## Additional Resources

### Documentation
- [Vitest Documentation](https://vitest.dev)
- [React Testing Library Docs](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Jest Matchers](https://jestjs.io/docs/expect)

### Testing Patterns
- [Testing Library Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

### Performance
- [Web Vitals](https://web.dev/vitals)
- [Core Web Vitals Guide](https://web.dev/core-web-vitals)
- [Performance Monitoring](https://web.dev/performance-monitoring)

---

## Contributing Tests

When contributing tests to BeMoreFrontend:

1. **Choose the Right Tier**
   - New utility? → Unit test (Tier 1)
   - New component? → Component test (Tier 2)
   - New user flow? → E2E test (Tier 3)

2. **Follow Naming Convention**
   - Descriptive test names
   - Clear file structure
   - Organized by feature/module

3. **Write for Maintainability**
   - Avoid testing implementation details
   - Use helper functions for repeated setup
   - Keep tests small and focused

4. **Ensure Quality**
   - Run `npm run test` before committing
   - Check coverage with `npm run test:coverage`
   - Verify all tests pass in CI/CD

5. **Document Complex Tests**
   - Add comments explaining test purpose
   - Document any non-obvious setup
   - Include troubleshooting notes

---

## Contact & Support

For testing questions or issues:
- Review this documentation
- Check test examples in existing test files
- Run `npm run test -- --help` for Vitest options
- Run `npx playwright --help` for Playwright options

---

**Last Updated**: Q4 2024
**Test Suite Status**: 369 tests | 86.5% passing | 75% coverage
