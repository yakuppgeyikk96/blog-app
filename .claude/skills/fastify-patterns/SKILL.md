---
name: fastify-patterns
description: Fastify backend architecture and best practices. Use when writing or reviewing backend code in apps/api.
user-invokable: false
---

# Fastify Backend Patterns

## Plugin Architecture
- Fastify is built around plugins. Every feature should be a plugin.
- Use `fastify-plugin` (`fp`) for plugins that should share the parent context (decorators, hooks).
- Register route plugins WITHOUT `fp` so they get their own encapsulated context.

```typescript
// plugins/auth.ts — shared plugin (uses fp)
import fp from 'fastify-plugin';

export default fp(async function authPlugin(fastify) {
  fastify.decorate('authenticate', async (request, reply) => {
    // JWT verification logic
  });
});

// routes/posts/index.ts — route plugin (no fp)
export default async function postRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: getPostsSchema }, getPostsHandler);
}
```

## Project Structure (apps/api)
```
src/
  app.ts               → Fastify instance creation and plugin registration
  server.ts            → Server startup
  plugins/             → Reusable plugins
    auth.ts            → JWT authentication
    cors.ts            → CORS configuration
    database.ts        → Drizzle DB connection
  routes/              → Route modules
    posts/
      index.ts         → Route registration
      handlers.ts      → Route handler functions
      schemas.ts       → TypeBox schemas
    auth/
      index.ts
      handlers.ts
      schemas.ts
  services/            → Business logic
    post-service.ts
    auth-service.ts
  repositories/        → Database access layer
    post-repository.ts
    user-repository.ts
  utils/               → Helpers, constants
  types/               → Backend-specific types
drizzle/               → Drizzle config, migrations
  migrations/
```

## Layered Architecture
- **Routes** → define endpoints, schemas, call handlers
- **Handlers** → parse request, call services, format response
- **Services** → business logic, validation rules
- **Repositories** → database queries only

Never skip layers. Routes should not contain business logic. Services should not know about HTTP.

## TypeBox Schemas
- Define request/response schemas with TypeBox for every route.
- This gives you runtime validation AND TypeScript types from the same source.

```typescript
import { Type, Static } from '@sinclair/typebox';

export const CreatePostBody = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 200 }),
  content: Type.String({ minLength: 1 }),
  status: Type.Optional(Type.Union([
    Type.Literal('draft'),
    Type.Literal('published'),
  ])),
});

export type CreatePostBodyType = Static<typeof CreatePostBody>;

export const createPostSchema = {
  body: CreatePostBody,
  response: {
    201: PostResponse,
    400: ErrorResponse,
  },
};
```

## Error Handling
- Use Fastify's `setErrorHandler` for centralized error handling.
- Create custom error classes with HTTP status codes.
- Never expose internal errors to clients — return structured error responses.

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

## Auth (JWT + HTTP-only Cookies)
- Sign JWT tokens and set them as HTTP-only, Secure, SameSite cookies.
- Create a `preHandler` hook or decorator for protected routes.
- Hash passwords with bcrypt or argon2 — never store plaintext.
- Use short-lived access tokens + refresh tokens.

## Performance
- Use Fastify's built-in JSON serialization with schemas — it's significantly faster than `JSON.stringify`.
- Use `fastify.log` (pino) for logging — never `console.log`.
- Use connection pooling for PostgreSQL.

## Configuration
- Use environment variables with validation at startup (TypeBox or similar).
- Fail fast if required config is missing.
- Never hardcode secrets, URLs, or ports.
