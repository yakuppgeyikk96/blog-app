# Technology Decisions

This document explains the **why** behind each technology choice in the stack.

## Frontend: Next.js (App Router)

- **SSR/SSG support** — Blog content benefits from server-side rendering for faster initial loads and static generation for published posts.
- **SEO** — Server-rendered HTML is critical for blog discoverability. Next.js handles meta tags, Open Graph, and structured data out of the box.
- **Image optimization** — Built-in `next/image` handles responsive images, lazy loading, and format conversion (WebP/AVIF).
- **App Router** — Uses the modern App Router with React Server Components for cleaner data fetching patterns.

## Backend: Fastify

- **Performance** — Fastify is one of the fastest Node.js frameworks, with a low-overhead request pipeline.
- **Plugin system** — First-class plugin architecture for organizing cross-cutting concerns (JWT, cookies, database).
- **TypeBox integration** — Native support for TypeBox schemas enables compile-time TypeScript types and runtime JSON Schema validation from a single source of truth.
- **Schema-based validation** — Route-level request/response validation with automatic 400 errors for malformed requests.

## Database: PostgreSQL + Drizzle ORM

- **PostgreSQL** — Battle-tested relational database. Perfect for structured blog data with relationships (users, posts, comments).
- **Drizzle ORM** — Type-safe query builder with a SQL-like API. No magic — queries map closely to the SQL they generate.
- **Schema as code** — Table definitions in TypeScript serve as both the schema and the source for inferred types (`$inferSelect` / `$inferInsert`).
- **Migration support** — `drizzle-kit` generates SQL migrations from schema changes, with a clear migration history.

## Password Hashing: argon2

### Why argon2 Over bcrypt?

- **More modern** — argon2 won the Password Hashing Competition (PHC) in 2015 and represents the current state of the art.
- **Memory-hard** — Resistant to GPU/ASIC attacks because it requires significant memory, not just CPU time.
- **Configurable** — Fine-grained control over time cost, memory cost, and parallelism.
- **Recommended** — OWASP recommends argon2id as the first choice for password hashing.

## Styling: Tailwind CSS + shadcn/ui

- **Tailwind CSS** — Utility-first CSS framework that eliminates context switching between HTML and CSS files. Produces minimal CSS bundles through purging.
- **shadcn/ui** — Not a component library — it's a collection of copy-paste components built on Radix UI primitives. Components live in your codebase, so you own and customize them fully. No version lock-in.

## Monorepo: Turborepo + pnpm

- **Turborepo** — Intelligent build system that caches task outputs and only rebuilds what changed. Handles dependency ordering between packages automatically.
- **pnpm** — Fast, disk-efficient package manager with strict dependency isolation (no phantom dependencies). Workspace protocol (`workspace:*`) for internal package linking.

### Monorepo Package Structure

| Package                      | Purpose                             |
| ---------------------------- | ----------------------------------- |
| `apps/web`                   | Next.js frontend                    |
| `apps/api`                   | Fastify backend                     |
| `packages/shared-types`      | Shared TypeScript interfaces (DTOs) |
| `packages/ui`                | Shared UI components (shadcn/ui)    |
| `packages/eslint-config`     | Shared ESLint configuration         |
| `packages/typescript-config` | Shared TypeScript configuration     |

## Media Storage: MinIO / S3

- **MinIO** for local development — S3-compatible object storage that runs in Docker. Developers don't need an AWS account.
- **S3** for production — Standard, scalable, cost-effective object storage.
- **S3 API compatibility** — The same `@aws-sdk/client-s3` code works against both MinIO and S3 with only a config change.
