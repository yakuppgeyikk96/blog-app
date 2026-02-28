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

## Current Features (MVP)

- User authentication (register/login) with HTTP-only cookie JWT
- Create blog posts
- List and view blog posts

## Development

```bash
pnpm install        # Install dependencies
pnpm dev            # Start all apps in development mode
pnpm build          # Build all apps
pnpm lint           # Lint all apps
```
