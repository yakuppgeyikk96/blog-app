# Backend Architecture

## Overview

The API (`apps/api/`) is built with **Fastify** and follows a **layered architecture** organized by feature modules. Each layer has a single responsibility, and dependencies flow strictly downward.

## Request Flow

```
Request → Route → Handler → Service → Repository → Database
```

| Layer          | Responsibility                                                                 |
| -------------- | ------------------------------------------------------------------------------ |
| **Route**      | Endpoint definition + TypeBox request/response validation schemas. No logic.   |
| **Handler**    | Parse request, call service, format response. No business logic.               |
| **Service**    | Business logic (hashing, token generation, authorization). No direct DB access. |
| **Repository** | Data access via Drizzle ORM. CRUD operations only. No business logic.          |

### Why This Separation?

- **Testability** — Each layer can be unit-tested in isolation by mocking the layer below it.
- **Single Responsibility** — Routes don't know about business rules; services don't know about HTTP; repositories don't know about authorization.
- **Flexibility** — Swapping the ORM or adding a caching layer only affects the repository. Changing auth strategy only affects the service.

## Module-Based Organization

Each feature lives in its own module under `apps/api/src/modules/`:

```
modules/
  auth/
    auth.route.ts         → Endpoint definitions + TypeBox schemas
    auth.handler.ts       → Request/response handling
    auth.service.ts       → Business logic
    auth.repository.ts    → Database queries
    auth.schema.ts        → TypeBox validation schemas
    auth.mapper.ts        → Entity → DTO transformations
```

### File Naming Conventions

Files follow a strict `<module>.<layer>.ts` pattern:

| File                  | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `<module>.route.ts`   | Register endpoints, attach TypeBox schemas   |
| `<module>.handler.ts` | Extract request data, call service, reply     |
| `<module>.service.ts` | Orchestrate business logic                   |
| `<module>.repository.ts` | Drizzle queries (select, insert, update, delete) |
| `<module>.schema.ts`  | TypeBox schemas for runtime validation       |
| `<module>.mapper.ts`  | Convert database entities to safe DTOs       |

This convention makes it immediately clear what each file does and which module it belongs to.

## Plugin System

Cross-cutting concerns are registered as **Fastify plugins** in `apps/api/src/plugins/`. Plugins use `fastify-plugin` (fp) to make their decorators and hooks available application-wide (non-encapsulated).

Current plugins:

| Plugin          | Package              | Purpose                                     |
| --------------- | -------------------- | ------------------------------------------- |
| `sensible.ts`   | `@fastify/sensible`  | HTTP error helpers (`notFound()`, `badRequest()`, etc.) |

Planned plugins:

| Plugin       | Package           | Purpose                        |
| ------------ | ----------------- | ------------------------------ |
| JWT          | `@fastify/jwt`    | Token signing and verification |
| Cookie       | `@fastify/cookie`  | HTTP-only cookie management    |
| Database     | Custom            | Drizzle DB instance decorator  |

### How Autoload Works

The app uses `@fastify/autoload` to automatically register everything in the `plugins/` and `routes/` directories:

```ts
// plugins — non-encapsulated, global decorators
fastify.register(AutoLoad, { dir: join(__dirname, "plugins") });

// routes — encapsulated route plugins
fastify.register(AutoLoad, { dir: join(__dirname, "routes") });
```

Any `.ts` file dropped into these directories is automatically picked up — no manual registration needed.

## Guard Pattern

Auth guards are implemented as **Fastify `preHandler` hooks** in `apps/api/src/common/guards.ts`.

A guard is a function that runs before the route handler. It verifies the JWT from the request cookie and attaches the authenticated user to the request object. If verification fails, the guard short-circuits the request with a 401 response.

```
Request → preHandler (guard) → Handler → ...
```

Guards are applied at the route level, so only protected endpoints include them. Public endpoints (like login and register) skip the guard entirely.
