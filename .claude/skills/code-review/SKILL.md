---
name: code-review
description: Review code for quality, security, and adherence to project conventions.
user-invokable: true
argument-hint: "[file or directory path]"
---

# Code Review Checklist

Review the specified code against the following criteria. Be specific — reference file paths and line numbers.

## 1. Architecture
- [ ] Follows the layered architecture (routes → handlers → services → repositories)
- [ ] No business logic in route handlers or components
- [ ] No database access from the frontend
- [ ] Proper separation of concerns

## 2. TypeScript Quality
- [ ] No `any` types — uses `unknown` with type guards
- [ ] Exported functions have explicit return types
- [ ] Uses `as const` objects instead of enums
- [ ] Proper error handling with typed errors or Result types
- [ ] No non-null assertions (`!`)

## 3. Security
- [ ] User input is validated (TypeBox on backend, zod/form validation on frontend)
- [ ] No SQL injection risk — parameterized queries only
- [ ] No XSS risk — no `dangerouslySetInnerHTML` without sanitization
- [ ] Secrets are in environment variables, not hardcoded
- [ ] Auth checks on all protected routes

## 4. Performance
- [ ] No N+1 query patterns
- [ ] Only necessary columns selected from database
- [ ] Images use `next/image` with dimensions
- [ ] No unnecessary client-side JavaScript (`"use client"` only when needed)
- [ ] Proper pagination on list endpoints

## 5. Clean Code
- [ ] Functions are small and single-purpose
- [ ] Naming is clear and consistent with project conventions
- [ ] No dead code or commented-out code
- [ ] Early returns to reduce nesting
- [ ] DRY — no unnecessary duplication

## Output Format
For each issue found, report:
- **File:** path and line number
- **Severity:** Critical / Warning / Suggestion
- **Issue:** What's wrong
- **Fix:** How to fix it
