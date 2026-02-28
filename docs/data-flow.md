# Data Flow & Type Strategy

## Overview

The project uses a three-tier type system to ensure data safety and type correctness across the entire stack:

```
Database ←→ Entity ←→ Service ←→ DTO ←→ Client
```

## Type Categories

| Type              | Where Defined          | Where Used           | Example                               |
| ----------------- | ---------------------- | -------------------- | ------------------------------------- |
| **Entity**        | Drizzle schema         | Repository ↔ Service | Full DB row (includes `passwordHash`) |
| **Input DTO**     | `shared-types` package | Client → Handler     | `{ email, password, name }`           |
| **Response DTO**  | `shared-types` package | Handler → Client     | `{ id, email, name }` (safe fields)  |

## Entity Types (Drizzle Schema)

Entity types are **inferred directly from the Drizzle schema** — never manually defined:

```ts
// apps/api/src/db/schema/users.ts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

// Inferred types — always in sync with the schema
type User = typeof users.$inferSelect;       // Full row (SELECT *)
type NewUser = typeof users.$inferInsert;     // Insert shape (respects defaults)
```

### Why Infer Instead of Manually Define?

- **Single source of truth** — The schema defines the table AND the types. No drift between them.
- **Automatic updates** — Adding a column to the schema automatically updates every type that references it.
- **No duplication** — No parallel interface definitions to keep in sync.

## DTO Types (shared-types Package)

DTOs (Data Transfer Objects) live in `packages/shared-types/` and are shared between the frontend and backend:

- **Input DTOs** define what the client sends (e.g., `RegisterInput`, `LoginInput`).
- **Response DTOs** define what the client receives (e.g., `UserResponse`).

DTOs deliberately **exclude sensitive fields** like `passwordHash`. They represent the public API contract.

### Why a Shared Package?

Both `apps/web` and `apps/api` import from `shared-types`. This means:

- The frontend knows exactly what shape to send and expect.
- Type mismatches between frontend and backend are caught at compile time.
- API contract changes are explicit and visible in version control.

## TypeBox Schemas (Runtime Validation)

TypeBox schemas handle **runtime validation** at the route level:

```ts
// auth.schema.ts
const RegisterBody = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
  name: Type.String({ minLength: 1 }),
});
```

TypeBox schemas serve a dual purpose:

1. **Runtime validation** — Fastify uses them as JSON Schema to validate incoming requests. Malformed requests get a 400 error before reaching any handler code.
2. **Compile-time types** — TypeBox schemas produce TypeScript types via `Static<typeof Schema>`, keeping runtime and compile-time validation in sync.

### Validation Boundary

Validation happens **only at the route level** — the system boundary where external input enters the application. Internal layers (handler, service, repository) trust that data has already been validated.

## Mapper Functions

Mapper functions convert database entities to safe response DTOs:

```ts
// auth.mapper.ts
function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // passwordHash is deliberately NOT included
  };
}
```

### Why Mapper Functions Over class-transformer?

- **Simplicity** — Plain functions are easy to read, test, and debug. No decorators, no reflection metadata.
- **Explicit** — You can see exactly which fields are included and excluded. Nothing is hidden behind annotations.
- **No over-engineering** — class-transformer adds decorators, metadata reflection, and a class-based model. For a blog app, a simple function does the same job with zero dependencies.
- **Type-safe** — TypeScript checks that the returned object matches the DTO interface. Missing or extra fields are compile-time errors.

### Security: Sensitive Field Stripping

The mapper layer is the **security boundary** for outgoing data. Sensitive fields like `passwordHash` are stripped here, ensuring they never leak to the client regardless of what the service returns.

This is enforced by the DTO interface — if the response type doesn't include `passwordHash`, TypeScript prevents it from being included.

## Complete Data Flow Example

Here's how a user registration flows through the system:

```
1. Client sends POST /auth/register
   Body: { email, password, name }              ← Input DTO shape

2. Route validates request body
   TypeBox schema checks email format,           ← Runtime validation
   password length, name presence

3. Handler extracts validated body
   Passes to auth service                        ← No logic, just wiring

4. Service hashes password with argon2
   Calls repository with entity data             ← Business logic

5. Repository inserts into database
   Returns full entity (includes passwordHash)   ← CRUD only

6. Service passes entity to mapper
   Mapper strips passwordHash                    ← Entity → DTO

7. Handler returns response DTO
   Client receives: { id, email, name, ... }     ← Safe response
```
