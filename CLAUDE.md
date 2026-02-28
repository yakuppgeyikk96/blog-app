# Blog App

A fullstack blog application built as a Turborepo monorepo.

## Project Structure

```
apps/
  web/                → Next.js frontend (App Router)
  api/                → Fastify backend (REST API)
packages/
  shared-types/       → Shared TypeScript types between frontend and backend
  ui/                 → Shared UI components (shadcn/ui)
  eslint-config/      → Shared ESLint configuration
  typescript-config/  → Shared TypeScript configuration
```

## Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Frontend       | Next.js (App Router)    |
| Backend        | Fastify + TypeBox       |
| Database       | PostgreSQL + Drizzle ORM|
| Auth           | JWT with HTTP-only cookies |
| Styling        | Tailwind CSS + shadcn/ui|
| Media Storage  | MinIO (S3-compatible, local dev) / S3 (production) |
| Monorepo       | Turborepo + pnpm        |
| Language       | TypeScript              |

## Backend Architecture

The API follows a **layered architecture** organized by feature modules.

### Request Flow

```
Request → Route → Handler → Service → Repository → Database
```

| Layer        | Responsibility                                                              |
| ------------ | --------------------------------------------------------------------------- |
| **Route**    | Endpoint definition + TypeBox request/response validation schemas. No logic |
| **Handler**  | Parse request, call service, format response. No logic                      |
| **Service**  | Business logic (hashing, token generation, authorization). No direct DB     |
| **Repository** | Data access via Drizzle ORM. CRUD only. No logic                          |

### Module Structure

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

### Data Flow & Type Mapping

| Type              | Where Used          | Example                             |
| ----------------- | ------------------- | ----------------------------------- |
| **Entity**        | Repository ↔ Service | Full DB row (includes passwordHash) |
| **Input DTO**     | Client → Handler    | `{ email, password, name }`         |
| **Response DTO**  | Handler → Client    | `{ id, email, name }` (safe fields) |

- **Entity types** are inferred from Drizzle schema (`$inferSelect` / `$inferInsert`).
- **DTO interfaces** live in `packages/shared-types/` (shared with frontend).
- **Mapper functions** (`auth.mapper.ts`) convert Entity → DTO. Sensitive fields (e.g., `passwordHash`) are stripped here.
- **TypeBox schemas** (`auth.schema.ts`) handle runtime validation at the route level.

### Plugins

Cross-cutting concerns (JWT, cookie, database) are registered as Fastify plugins in `apps/api/src/plugins/`.

### Guards

Auth guards are implemented as `preHandler` hooks in `apps/api/src/common/guards.ts`.

## Current Features (MVP)

- User authentication (register/login) with HTTP-only cookie JWT
- Create blog posts
- List and view blog posts

## Core Principles

- **Design docs are the source of truth** — `docs/` altındaki dokümanlar plan veya prompt ile çelişirse, doküman kazanır.
- **Clean code** — `.claude/skills/clean-code/SKILL.md` tüm kod yazma ve review işlemlerinde geçerlidir.
- **Read before implement** — Bir feature'a başlamadan önce ilgili `docs/` dosyalarını oku.

## Design Documents

Detailed design decisions live in `docs/`. **Before implementing any feature, read the relevant docs first.** The design documents are the source of truth — if a plan or prompt conflicts with a doc, follow the doc.

| Document              | Covers                                        |
| --------------------- | --------------------------------------------- |
| `docs/auth.md`        | JWT payload, password hashing, cookie config, auth guard |
| `docs/data-flow.md`   | Entity vs DTO, shared-types package, mappers  |
| `docs/architecture.md`| Layered architecture, module structure        |
| `docs/tech-stack.md`  | Technology choices and rationale              |

## Development

```bash
pnpm install        # Install dependencies
pnpm dev            # Start all apps in development mode
pnpm build          # Build all apps
pnpm lint           # Lint all apps
```
