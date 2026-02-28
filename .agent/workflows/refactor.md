---
description: Systematic code refactoring
---

# Workflow: Systematic Code Refactoring

This workflow identifies tech debt, code duplication, and architectural improvements.

## Prerequisites
- Read PROJECT_RULES.md before starting
- Ensure all tests pass before refactoring

## Steps

### 1. Read Project Rules

Review the current coding standards:
- Read `PROJECT_RULES.md`
- Understand the architecture patterns
- Note any recent error patterns to avoid

### 2. Scan for Code Duplication

Identify duplicate code patterns in:
- `src/lib/solana/` - Solana-related logic
- `src/components/` - React components
- `src/app/` - Next.js pages

Look for:
- Repeated logic (extract to utilities)
- Similar components (create shared component)
- Duplicate type definitions (consolidate in `src/types/`)

### 3. Identify Type Safety Issues

Scan for:
- Usage of `any` type
- Missing type annotations
- Implicit `any` in function parameters
- Untyped API responses

### 4. Check for Anti-patterns

Look for:
- `console.log` statements
- Hardcoded values (should be constants)
- Missing error handling
- Unhandled promise rejections
- Large components (>200 lines)

### 5. Propose Refactoring Plan

Create a plan with:
- Files to refactor
- Specific changes to make
- Estimated impact (low/medium/high)
- Risk assessment

### 6. Execute Refactoring

For each file:
1. Create a backup (git commit)
2. Apply refactoring
3. Run tests
4. Verify functionality
5. Update documentation if needed

### 7. Update PROJECT_RULES.md

Add any new patterns or rules discovered during refactoring:
```
"Update PROJECT_RULES.md with the new pattern we just implemented."
```

### 8. Verify Changes

// turbo
Run linting:
```bash
npm run lint
```

// turbo
Run build:
```bash
npm run build
```

## Refactoring Priorities

### High Priority
- Remove `any` types
- Fix error handling
- Extract duplicate code

### Medium Priority
- Improve component structure
- Optimize imports
- Add missing types

### Low Priority
- Rename variables for clarity
- Add JSDoc comments
- Organize file structure

## Notes

- Never refactor without tests
- Make small, incremental changes
- Commit after each successful refactoring
- Update PROJECT_RULES.md with lessons learned
