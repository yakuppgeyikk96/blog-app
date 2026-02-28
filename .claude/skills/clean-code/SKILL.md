---
name: clean-code
description: Clean code principles and design document adherence. Use when writing, reviewing, or planning any code changes.
user-invokable: false
---

# Clean Code Principles

## Design Documents Are the Source of Truth

Before implementing any feature, **read the relevant docs in `docs/`**. If a plan, prompt, or assumption conflicts with a design document, **follow the document**.

- `docs/auth.md` → JWT payload shape, password hashing, cookie config
- `docs/data-flow.md` → Entity vs DTO, where types live, mapper patterns
- `docs/architecture.md` → Layered architecture, module boundaries
- `docs/tech-stack.md` → Technology choices and rationale

When implementing from a plan:
1. Identify which docs are relevant to the task
2. Read those docs before writing any code
3. If the plan contradicts a doc, flag the conflict — do not silently follow the plan

## Functions

- **Single Responsibility** — Each function does one thing. If you need "and" to describe it, split it.
- **Small** — Max ~20 lines. Extract helpers if a function grows beyond this.
- **One level of abstraction** — Don't mix high-level orchestration with low-level details in the same function.
- **No side effects** — A function named `getUser` should not modify state. Name functions honestly.
- **Max 3 parameters** — Use an options object if you need more.

## Naming

- Names should reveal intent. `d` is bad, `elapsedDays` is good.
- Don't encode types in names (`userArray`, `nameString`) — the type system does this.
- Use verb phrases for functions (`createUser`, `validateEmail`), noun phrases for variables (`activeUsers`, `postCount`).
- Be consistent — if `find` returns one item, don't use `get` elsewhere for the same concept.
- Boolean names should read as a question: `isValid`, `hasAccess`, `canEdit`.

## DRY — But Don't Over-Abstract

- Duplicate code is a missed abstraction, but **premature abstraction is worse than duplication**.
- Rule of three: tolerate duplication until you see the pattern three times.
- When you extract, the abstraction must be simpler to understand than the inlined versions.

## Error Handling

- Don't ignore errors. Don't swallow catches.
- Fail fast — validate at system boundaries, trust internal data.
- Use specific error messages. `"Invalid input"` is useless. `"Email already registered"` is actionable.
- Same error for similar failures to prevent information leakage (e.g., login always says `"Invalid email or password"`).

## Comments

- Don't comment *what* the code does — make the code self-explanatory.
- Comment *why* when the reason isn't obvious (business rules, workarounds, non-obvious decisions).
- Delete commented-out code — version control remembers it.

## File & Module Organization

- One concept per file. Don't put unrelated functions in a utils file.
- Group by feature (modules/auth/*), not by type (all services together).
- Keep related code close — if two functions always change together, they belong in the same file.

## Dependencies & Coupling

- Depend on abstractions (interfaces), not implementations.
- Use dependency injection — pass dependencies in, don't import singletons.
- Layers only call the layer directly below them (Route → Handler → Service → Repository).

## Data

- Don't pass more data than needed. A function that needs a user's email should take `email: string`, not `user: User`.
- Sensitive fields are explicitly excluded via mapper functions — never rely on spread/rest to omit fields.
- Types shared between frontend and backend live in `packages/shared-types/`. Backend-only types stay local.
