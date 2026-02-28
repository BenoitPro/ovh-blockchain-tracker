---
description: Generate unit and integration tests
---

# Workflow: Test Generation

This workflow systematically generates tests for untested code and improves test coverage.

## Prerequisites
- Read PROJECT_RULES.md for testing standards
- Ensure testing framework is set up (vitest recommended)

## Steps

### 1. Identify Untested Files

Scan the project for files without tests:
- Check `src/lib/solana/` for untested functions
- Check `src/lib/asn/` for untested utilities
- Check `src/components/` for untested components

Priority order:
1. Business logic (`lib/`)
2. API routes (`app/api/`)
3. Components (`components/`)

### 2. Analyze Function Complexity

For each untested file, identify:
- Pure functions (easiest to test)
- Functions with side effects (need mocking)
- Async functions (need async testing)
- Functions with external dependencies

### 3. Generate Unit Tests

For each function, create tests that cover:
- **Happy path**: Normal execution
- **Edge cases**: Empty inputs, null values, boundary conditions
- **Error cases**: Invalid inputs, network failures, timeouts

Test naming convention:
```typescript
describe('functionName', () => {
  it('should do X when Y', () => {
    // Test implementation
  });
});
```

### 4. Generate Integration Tests

For API routes and complex workflows:
- Test end-to-end flows
- Mock external services (Solana RPC, MaxMind)
- Verify data transformations

### 5. Set Up Test Files

Create test files following this structure:
```
src/lib/solana/fetchNodes.ts
src/lib/solana/fetchNodes.test.ts
```

### 6. Write Test Implementation

Example test structure:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { functionToTest } from './module';

describe('functionToTest', () => {
  it('should return expected result when given valid input', () => {
    const result = functionToTest(validInput);
    expect(result).toEqual(expectedOutput);
  });

  it('should throw error when given invalid input', () => {
    expect(() => functionToTest(invalidInput)).toThrow();
  });
});
```

### 7. Run Tests

// turbo
Execute the test suite:
```bash
npm test
```

### 8. Check Coverage

// turbo
Generate coverage report:
```bash
npm test -- --coverage
```

Target: 70% coverage minimum (as per PROJECT_RULES.md)

### 9. Fix Failing Tests

If tests fail:
1. Analyze the failure
2. Fix the test or the code
3. Re-run tests
4. Update PROJECT_RULES.md if a new pattern is discovered

### 10. Document Test Patterns

Add common test patterns to PROJECT_RULES.md:
```
"Update PROJECT_RULES.md with the test pattern we just used."
```

## Test Priorities

### High Priority (Test First)
- `src/lib/solana/calculateMetrics.ts`
- `src/lib/solana/filterOVH.ts`
- `src/lib/asn/maxmind.ts`

### Medium Priority
- `src/lib/solana/fetchNodes.ts`
- API routes in `src/app/api/`

### Low Priority
- UI components (test only critical ones)
- Static pages

## Testing Best Practices

- **Arrange-Act-Assert**: Structure tests clearly
- **One assertion per test**: Keep tests focused
- **Mock external dependencies**: Don't call real APIs in tests
- **Use descriptive names**: Test names should explain what they verify
- **Test behavior, not implementation**: Focus on outputs, not internals

## Notes

- Run tests before every commit
- Update tests when refactoring
- Keep tests simple and readable
- Use PROJECT_RULES.md checklist before committing tests
