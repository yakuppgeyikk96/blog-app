# Authentication Design

## Overview

Authentication uses **JWT tokens stored in HTTP-only cookies**. This combines the statelessness of JWTs with the security benefits of HTTP-only cookies.

## Why JWT + HTTP-only Cookies?

| Approach              | Pros                        | Cons                                      |
| --------------------- | --------------------------- | ----------------------------------------- |
| JWT in localStorage   | Simple client-side access   | Vulnerable to XSS                         |
| JWT in HTTP-only cookie | Immune to XSS, automatic   | Requires CSRF protection                  |
| Session-based         | Revocable, small cookie     | Requires server-side storage, not stateless |

**Decision: JWT in HTTP-only cookie** — Best balance of security and simplicity for a blog app.

### Cookie Configuration

| Property     | Value      | Why                                              |
| ------------ | ---------- | ------------------------------------------------ |
| `httpOnly`   | `true`     | JavaScript cannot read the token (XSS protection) |
| `sameSite`   | `strict`   | Cookie only sent on same-site requests (CSRF protection) |
| `secure`     | `true`*    | Cookie only sent over HTTPS (* except in dev)    |
| `path`       | `/`        | Available to all API routes                      |

With `httpOnly` + `sameSite: strict`, the token is protected against both XSS and CSRF without needing additional CSRF tokens.

## JWT Payload

The JWT payload contains **only the user ID**:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Why Minimal Payload?

- **No sensitive data** — Email, name, and especially password hash are never in the token.
- **No stale data** — User profile changes (name, email) don't invalidate the token because none of that data is in it.
- **Small token size** — Less data means a smaller cookie on every request.
- **Single lookup** — The auth guard fetches the current user from the database using the userId, ensuring data is always fresh.

## Password Hashing

Passwords are hashed using **argon2id** before storage:

- **Algorithm** — argon2id (hybrid variant, resistant to both side-channel and GPU attacks)
- **Library** — `argon2` npm package (uses native bindings for performance)
- **When** — Hashing happens in the **service layer** (`auth.service.ts`), not in the repository

The raw password never reaches the database layer. The service hashes it and passes `passwordHash` to the repository.

## Fastify Plugins

| Plugin            | Package           | Role                                          |
| ----------------- | ----------------- | --------------------------------------------- |
| JWT plugin        | `@fastify/jwt`    | `fastify.jwt.sign()` and `fastify.jwt.verify()` |
| Cookie plugin     | `@fastify/cookie` | Parse and set HTTP-only cookies on responses   |

Both are registered as non-encapsulated Fastify plugins (via `fastify-plugin`) so they're available application-wide.

## Auth Guard

The auth guard is a `preHandler` hook that protects routes requiring authentication:

```
Request → Cookie parsed → JWT verified → User fetched → Handler runs
```

Guard behavior:

1. Extract JWT from the HTTP-only cookie.
2. Verify the token signature and expiration using `@fastify/jwt`.
3. Decode the `userId` from the payload.
4. Fetch the user from the database.
5. Attach the user to the request object (e.g., `request.user`).
6. If any step fails, return **401 Unauthorized**.

The guard is applied selectively — only routes that need authentication include it as a `preHandler` hook.

## API Endpoints

### POST /auth/register

Creates a new user account.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Validation (TypeBox):**
- `email` — valid email format
- `password` — minimum 8 characters
- `name` — non-empty string

**Flow:**
1. Validate request body (route-level TypeBox schema).
2. Check if email already exists (service → repository).
3. Hash password with argon2id (service).
4. Insert user into database (repository).
5. Sign JWT with userId (service).
6. Set JWT in HTTP-only cookie (handler).
7. Return user response DTO (mapper strips `passwordHash`).

**Response:** `201 Created` with user data (id, email, name, timestamps).

### POST /auth/login

Authenticates an existing user.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Flow:**
1. Validate request body.
2. Find user by email (service → repository).
3. Verify password against stored hash with argon2 (service).
4. If invalid, return **401 Unauthorized**.
5. Sign JWT with userId (service).
6. Set JWT in HTTP-only cookie (handler).
7. Return user response DTO.

**Response:** `200 OK` with user data.

## Security Summary

| Threat          | Mitigation                                           |
| --------------- | ---------------------------------------------------- |
| XSS token theft | HTTP-only cookie (JS cannot access)                  |
| CSRF            | `sameSite: strict` (cookie not sent cross-origin)    |
| Password leak   | argon2id hashing, mapper strips hash from responses  |
| Token tampering  | JWT signature verification                           |
| Stale JWT data  | Minimal payload (only userId), fresh DB lookup       |
