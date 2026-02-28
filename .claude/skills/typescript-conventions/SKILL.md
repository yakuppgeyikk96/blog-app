---
name: typescript-conventions
description: TypeScript coding conventions and best practices. Use when writing or reviewing any TypeScript code in this project.
user-invokable: false
---

# TypeScript Conventions

## Strict Mode
- All projects use `strict: true`. Never use `any` — use `unknown` and narrow with type guards.
- Enable `noUncheckedIndexedAccess` for safe array/object access.

## Types vs Interfaces
- Use `interface` for object shapes that may be extended (e.g., API responses, props).
- Use `type` for unions, intersections, mapped types, and utility types.
- Never use `enum` — use `as const` objects with derived union types instead.

```typescript
// Bad
enum Status { Draft, Published }

// Good
const POST_STATUS = { DRAFT: 'draft', PUBLISHED: 'published' } as const;
type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];
```

## Naming
- **Files/directories:** kebab-case (`user-service.ts`, `post-repository.ts`)
- **Types/Interfaces:** PascalCase (`PostResponse`, `CreateUserInput`)
- **Functions/variables:** camelCase (`getUserById`, `postCount`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `DEFAULT_LIMIT`)
- **Boolean variables:** prefix with `is`, `has`, `can`, `should` (`isPublished`, `hasAccess`)

## Functions
- Prefer named function declarations over arrow functions for top-level exports.
- Keep functions small — single responsibility, max ~30 lines.
- Use early returns to reduce nesting.
- Always type parameters and return types for exported functions.

```typescript
// Bad
export const getUser = async (id: string) => {
  // ...
};

// Good
export async function getUserById(id: string): Promise<User | null> {
  // ...
}
```

## Error Handling
- Use custom error classes extending `Error` for domain errors.
- Never swallow errors silently — always log or rethrow.
- Use discriminated unions for results instead of throwing where appropriate.

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

## Imports
- Use path aliases (`@/` prefix) instead of deep relative imports.
- Group imports: external libs → internal packages → relative modules.
- Never use default exports except for Next.js pages/layouts.

## Nullability
- Prefer `undefined` over `null` for optional values.
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual checks.
- Never use non-null assertion (`!`) — narrow the type properly instead.
